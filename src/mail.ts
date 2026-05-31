import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "127.0.0.1",
  port: 1025,
});

type SendMailData = {
  to: string;
  subject: string;
  text: string;
};

export const sendMail = (data: SendMailData) =>
  transporter.sendMail({
    from: "Автомойка <noreply@wash.cars>",
    ...data,
  });
