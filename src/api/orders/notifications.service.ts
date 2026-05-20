class NotificationsService {
  async sendOrderCompletedEmail(email: string, orderId: number) {
    console.log(`Send order completed email to ${email} for order #${orderId}`);
  }
}

export const NotificationsServiceSingleton = new NotificationsService();
