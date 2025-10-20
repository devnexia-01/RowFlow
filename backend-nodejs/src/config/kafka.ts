import { Kafka, Producer } from 'kafkajs';
import { KAFKA_ENABLED, KAFKA_BROKER } from './env.js';

let producer: Producer | null = null;
let enabled: boolean = false;

const createKafkaProducer = () => {
  if (KAFKA_ENABLED && KAFKA_BROKER) {
    try {
      const kafka = new Kafka({
        clientId: 'fourinrow-backend',
        brokers: [KAFKA_BROKER],
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
};

const connect = async (): Promise<void> => {
  if (enabled && producer) {
    try {
      await producer.connect();
      console.log('✅ Kafka producer connected');
    } catch (error) {
      console.error('❌ Kafka connection failed:', error);
      enabled = false;
    }
  }
};

const sendEvent = async (eventType: string, data: any): Promise<void> => {
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
};

const disconnect = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
  }
};

export {
  createKafkaProducer,
  connect,
  sendEvent,
  disconnect,
};
