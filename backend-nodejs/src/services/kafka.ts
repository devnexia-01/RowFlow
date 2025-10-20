import { Kafka, Producer } from 'kafkajs';

let producer: Producer | null = null;
let enabled: boolean = false;

export function createKafkaProducer() {
  const kafkaEnabled = process.env.KAFKA_ENABLED === 'true';
  const kafkaBroker = process.env.KAFKA_BROKER;

  if (kafkaEnabled && kafkaBroker) {
    try {
      const kafka = new Kafka({
        clientId: 'fourinrow-backend',
        brokers: [kafkaBroker],
      });

      producer = kafka.producer();
      enabled = true;
      console.log('✅ Kafka producer initialized');
    } catch (error) {
      console.error('❌ Kafka initialization failed:', error);
      enabled = false;
    }
  } else {
    console.warn('⚠️  Kafka disabled or not configured');
    enabled = false;
  }
}

export async function connect(): Promise<void> {
  if (enabled && producer) {
    try {
      await producer.connect();
      console.log('✅ Kafka producer connected');
    } catch (error) {
      console.error('❌ Kafka connection failed:', error);
      enabled = false;
    }
  }
}

export async function sendEvent(eventType: string, data: any): Promise<void> {
  if (!enabled || !producer) return;

  try {
    await producer.send({
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

export async function disconnect(): Promise<void> {
  if (producer) {
    await producer.disconnect();
  }
}
