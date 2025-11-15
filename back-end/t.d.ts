interface DeviceRequestBody {
  device_id: string;
  data: SensorRequestData[];
}

interface SensorRequestData {
  name: string;
  temperature: number;
  humidity: number;
}

interface DatabaseQuerySelectReadings {
  id: string;
  building: string | null;
  device: string;
  sensor_id: number;
  time: number;
  temperature: number;
  humidity: number;
  vpd: number;
}

interface ReadingsResponseData {
  sensor: number;
  time: number;
  vpd: number;
  temperature: number;
  humidity: number;
}

interface Key {
  buildings: {
    id: number;
    name: string;
  }[];
  devices: {
    id: number;
    sensors: {
      id: number;
    };
  }[];
  sensors: {
    id: number;
    name: string;
    device: number;
    building: number;
  }[];
}
