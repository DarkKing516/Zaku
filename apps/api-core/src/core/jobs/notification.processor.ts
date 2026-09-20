import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  async process(job: Job<{ email: string; subject: string }>): Promise<{ success: true }> {
    try {
      if (job.name !== 'send-email') {
        return { success: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
