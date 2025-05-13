import nodemailer from 'nodemailer';

const EMAIL_USER = 'jobran628@gmail.com';
const EMAIL_APP_PASSWORD = 'dmlg kzwu chts pbra';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_APP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: EMAIL_USER,
        to,
        subject,
        text: body,
    });
}
