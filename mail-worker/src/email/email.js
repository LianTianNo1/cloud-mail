import PostalMime from 'postal-mime';
import emailService from '../service/email-service';
import accountService from '../service/account-service';
import settingService from '../service/setting-service';
import attService from '../service/att-service';
import constant from '../const/constant';
import fileUtils from '../utils/file-utils';
import { emailConst, isDel, roleConst, settingConst } from '../const/entity-const';
import emailUtils from '../utils/email-utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import roleService from '../service/role-service';
import verifyUtils from '../utils/verify-utils';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function email(message, env, ctx) {

	try {

		const {
			receive,
			tgBotToken,
			tgChatId,
			tgBotStatus,
			forwardStatus,
			forwardEmail,
			ruleEmail,
			ruleType,
			r2Domain,
			noRecipient
		} = await settingService.query({ env });

		if (receive === settingConst.receive.CLOSE) {
			return;
		}


		const reader = message.raw.getReader();
		let content = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			content += new TextDecoder().decode(value);
		}

		const email = await PostalMime.parse(content);

		// 支持从 Google Workspace 转发的邮件处理
		// 处理子域名转发的情况
		let realRecipient = message.to;
		
		console.log('收到邮件 - 原始收件人:', message.to);
		console.log('发件人:', email.from?.address);
		console.log('主题:', email.subject);
		
		// 检查是否是从子域名 worker.apu.edu.kg 转发的邮件
		if (message.to.includes('worker.apu.edu.kg')) {
			console.log('检测到子域名转发邮件');
			
			// 方法1: 从邮件头中提取原始收件人信息
			const headers = email.headers || {};
			const originalTo = headers['x-original-to'] || 
							   headers['delivered-to'] || 
							   headers['x-forwarded-to'] ||
							   headers['x-forwarded-for'];
			
			if (originalTo) {
				realRecipient = originalTo;
				console.log('从邮件头找到原始收件人:', realRecipient);
			} else {
				// 方法2: 如果邮件头中没有原始收件人信息，使用映射规则
				// forward-target@worker.apu.edu.kg -> 对应的真实邮箱
				
				// 这里需要根据你的实际邮箱配置来映射
				// 例如：forward-target@worker.apu.edu.kg -> langtian@apu.edu.kg
				if (message.to === 'forward-target@worker.apu.edu.kg') {
					// 你需要在这里指定对应的真实邮箱地址
					// 可以从环境变量中读取，或者硬编码
					realRecipient = env.REAL_EMAIL || 'langtian@apu.edu.kg';
					console.log('使用映射规则，真实收件人:', realRecipient);
				} else {
					// 通用规则：将 worker.apu.edu.kg 替换为 apu.edu.kg
					realRecipient = message.to.replace('worker.apu.edu.kg', 'apu.edu.kg');
					console.log('使用通用映射规则，真实收件人:', realRecipient);
				}
			}
		}

		console.log('最终确定的收件人:', realRecipient);

		const account = await accountService.selectByEmailIncludeDel({ env: env }, realRecipient);
		
		if (account) {
			console.log('找到对应账户:', account.email);
		} else {
			console.log('未找到对应账户，收件人:', realRecipient);
		}

		if (!account && noRecipient === settingConst.noRecipient.CLOSE) {
			return;
		}

		if (account && account.email !== env.admin) {

			let { banEmail, banEmailType, availDomain } = await roleService.selectByUserId({ env: env }, account.userId);

			if(!roleService.hasAvailDomainPerm(availDomain, message.to)) {
				return;
			}

			banEmail = banEmail.split(',').filter(item => item !== '');

			for (const item of banEmail) {

				if (verifyUtils.isDomain(item)) {

					const banDomain = item.toLowerCase();
					const receiveDomain = emailUtils.getDomain(email.from.address.toLowerCase());

					if (banDomain === receiveDomain) {

						if (banEmailType === roleConst.banEmailType.ALL) return;

						if (banEmailType === roleConst.banEmailType.CONTENT) {
							email.html = 'The content has been deleted';
							email.text = 'The content has been deleted';
							email.attachments = [];
						}

					}

				} else {

					if (item.toLowerCase() === email.from.address.toLowerCase()) {

						if (banEmailType === roleConst.banEmailType.ALL) return;

						if (banEmailType === roleConst.banEmailType.CONTENT) {
							email.html = 'The content has been deleted';
							email.text = 'The content has been deleted';
							email.attachments = [];
						}

					}

				}

			}

		}

		const toName = email.to.find(item => item.address === realRecipient)?.name || '';

		const params = {
			toEmail: realRecipient,
			toName: toName,
			sendEmail: email.from.address,
			name: email.from.name || emailUtils.getName(email.from.address),
			subject: email.subject,
			content: email.html,
			text: email.text,
			cc: email.cc ? JSON.stringify(email.cc) : '[]',
			bcc: email.bcc ? JSON.stringify(email.bcc) : '[]',
			recipient: JSON.stringify(email.to),
			inReplyTo: email.inReplyTo,
			relation: email.references,
			messageId: email.messageId,
			userId: account ? account.userId : 0,
			accountId: account ? account.accountId : 0,
			isDel: isDel.DELETE,
			status: emailConst.status.SAVING
		};

		const attachments = [];
		const cidAttachments = [];

		for (let item of email.attachments) {
			let attachment = { ...item };
			attachment.key = constant.ATTACHMENT_PREFIX + await fileUtils.getBuffHash(attachment.content) + fileUtils.getExtFileName(item.filename);
			attachment.size = item.content.length ?? item.content.byteLength;
			attachments.push(attachment);
			if (attachment.contentId) {
				cidAttachments.push(attachment);
			}
		}

		let emailRow = await emailService.receive({ env }, params, cidAttachments, r2Domain);

		attachments.forEach(attachment => {
			attachment.emailId = emailRow.emailId;
			attachment.userId = emailRow.userId;
			attachment.accountId = emailRow.accountId;
		});

		if (attachments.length > 0 && env.r2) {
			await attService.addAtt({ env }, attachments);
		}

		emailRow = await emailService.completeReceive({ env }, account ? emailConst.status.RECEIVE : emailConst.status.NOONE, emailRow.emailId);


		if (ruleType === settingConst.ruleType.RULE) {

			const emails = ruleEmail.split(',');

			if (!emails.includes(message.to)) {
				return;
			}

		}


		if (tgBotStatus === settingConst.tgBotStatus.OPEN && tgChatId) {

			const tgMessage = `<b>${params.subject}</b>

<b>发件人：</b>${params.name}		&lt;${params.sendEmail}&gt;
<b>收件人：\u200B</b>${message.to}
<b>时间：</b>${dayjs.utc(emailRow.createTime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm')}

${params.text || emailUtils.htmlToText(params.content) || ''}
`;

			const tgChatIds = tgChatId.split(',');

			await Promise.all(tgChatIds.map(async chatId => {
				try {
					const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							chat_id: chatId,
							parse_mode: 'HTML',
							text: tgMessage
						})
					});
					if (!res.ok) {
						console.error(`转发 Telegram 失败: chatId=${chatId}, 状态码=${res.status}`);
					}
				} catch (e) {
					console.error(`转发 Telegram 失败: chatId=${chatId}`, e);
				}
			}));
		}

		if (forwardStatus === settingConst.forwardStatus.OPEN && forwardEmail) {

			const emails = forwardEmail.split(',');

			await Promise.all(emails.map(async email => {

				try {
					await message.forward(email);
				} catch (e) {
					console.error(`转发邮箱 ${email} 失败：`, e);
				}

			}));

		}

	} catch (e) {

		console.error('邮件接收异常: ', e);
	}
}
