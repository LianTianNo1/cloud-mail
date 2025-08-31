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
	console.log('=== 邮件处理函数开始 ===');

	try {
		console.log('步骤1: 开始查询设置');
		console.log("看看-env:", env);

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

		console.log('步骤1: 设置查询完成');

		if (receive === settingConst.receive.CLOSE) {
			console.log('邮件接收已关闭，退出处理');
			return;
		}

		console.log('步骤2: 开始读取邮件原始数据');

		let reader, content = '';

		try {
			reader = message.raw.getReader();
			console.log('步骤2a: 获取 reader 成功');
		} catch (e) {
			console.error('步骤2a: 获取 reader 失败:', e);
			throw e;
		}

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				content += new TextDecoder().decode(value);
			}
			console.log('步骤2b: 读取邮件内容完成，长度:', content.length);
		} catch (e) {
			console.error('步骤2b: 读取邮件内容失败:', e);
			throw e;
		}

		console.log('步骤3: 开始解析邮件');

		let email;
		try {
			email = await PostalMime.parse(content);
			console.log('步骤3: 邮件解析成功');
		} catch (e) {
			console.error('步骤3: 邮件解析失败:', e);
			throw e;
		}

		// 支持从 Google Workspace 转发的邮件处理
		// 处理子域名转发的情况
		let realRecipient = message.to;
		console.log('看看-email:', JSON.stringify(email));

		console.log('收到邮件 - 原始收件人:', message.to);
		console.log('发件人:', email.from?.address);
		console.log('主题:', email.subject);

		// 检查是否是从子域名转发的邮件
		const forwardDomain = env.FORWARD_DOMAIN; // 例如: worker.apu.edu.kg
		const targetDomain = env.TARGET_DOMAIN;   // 例如: apu.edu.kg

		console.log('环境变量配置:');
		console.log('- FORWARD_DOMAIN:', forwardDomain);
		console.log('- TARGET_DOMAIN:', targetDomain);
		console.log('- REAL_EMAIL:', env.REAL_EMAIL);

		if (forwardDomain && message.to.includes(forwardDomain)) {
			console.log('检测到子域名转发邮件，转发域名:', forwardDomain);

			// 方法1: 从邮件头中提取原始收件人信息
			const headers = email.headers || {};
			console.log('邮件头类型:', typeof headers);
			console.log('邮件头内容:', headers);

			let originalTo = null;

			// 安全地读取邮件头
			try {
				if (headers && typeof headers === 'object') {
					// 如果 headers 是 Map 对象
					if (typeof headers.get === 'function') {
						originalTo = headers.get('x-original-to') ||
									 headers.get('delivered-to') ||
									 headers.get('x-forwarded-to') ||
									 headers.get('x-forwarded-for');
					} else {
						// 如果 headers 是普通对象
						originalTo = headers['x-original-to'] ||
									 headers['delivered-to'] ||
									 headers['x-forwarded-to'] ||
									 headers['x-forwarded-for'];
					}
				}
			} catch (e) {
				console.error('读取邮件头失败:', e);
			}

			if (originalTo) {
				realRecipient = originalTo;
				console.log('从邮件头找到原始收件人:', realRecipient);
			} else {
				// 方法2: 如果邮件头中没有原始收件人信息，使用映射规���

				// 检查是否有特定的邮箱映射配置
				if (env.REAL_EMAIL) {
					// 使用固定映射：任何发到转发域名的邮件都映射到指定邮箱
					realRecipient = env.REAL_EMAIL;
					console.log('使用固定映射规则，真实收件人:', realRecipient);
				} else if (targetDomain) {
					// 通用规则：将转发域名替换为目标域名
					realRecipient = message.to.replace(forwardDomain, targetDomain);
					console.log('使用域名替换规则，真实收件人:', realRecipient);
				} else {
					console.log('未配置映射规则，使用原始收件人');
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
