interface DeviceRequestBody {
  device_id: string;
  data: SensorRequestData[];
}

interface SensorRequestData {
  name: string;
  temperature: number;
  humidity: number;
}
