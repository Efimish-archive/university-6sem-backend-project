import { sendMail } from "@/mail";

class NotificationsService {
  async sendOrderCompletedEmail(email: string, orderId: number) {
    await sendMail({
      to: email,
      subject: `Заказ #${orderId} завершен`,
      text: `Здравствуйте! Ваш заказ #${orderId} в автомойке завершен.`,
    });
  }
}

export const NotificationsServiceSingleton = new NotificationsService();
