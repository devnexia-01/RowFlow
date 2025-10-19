import { Kafka, Producer } from 'kafkajs';

export class KafkaProducer {
  private producer: Producer | null = null;
  private enabled: boolean = false;

  constructor() {
    const kafkaEnabled = process.env.KAFKA_ENABLED === 'true';
    const kafkaBroker = process.env.KAFKA_BROKER;

    if (kafkaEnabled && kafkaBroker) {
      try {
        const kafka = new Kafka({
          clientId: 'fourinrow-backend',
          brokers: [kafkaBroker],
        });

        this.producer = kafka.producer();
        this.enabled = true;
        console.log('✅ Kafka producer initialized');
      } catch (error) {
        console.error('❌ Kafka initialization failed:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️  Kafka disabled or not configured');
      this.enabled = false;
    }
  }

  async connect(): Promise<void> {
    if (this.enabled && this.producer) {
      try {
        await this.producer.connect();
        console.log('✅ Kafka producer connected');
      } catch (error) {
        console.error('❌ Kafka connection failed:', error);
        this.enabled = false;
      }
    }
  }

  async sendEvent(eventType: string, data: any): Promise<void> {
    if (!this.enabled || !this.producer) return;

    try {
      await this.producer.send({
        topic: 'game-events',
        messages: [
          {
            key: eventType,
            value: JSON.stringify({
              type: eventType,
              timestamp: new Date().toISOString(),
              data,
            }),
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send Kafka event:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }
}
