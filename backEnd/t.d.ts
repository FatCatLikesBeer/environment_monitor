type MonitorPost = {
  monitorId: number;
  manufacturerKey: string;
  data: MonitorData[];
}

type MonitorData = {
  sensorId: string;
  temperature: number;
  humidity: number;
}
