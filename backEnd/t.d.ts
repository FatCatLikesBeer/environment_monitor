type MonitorPost = {
  monitorId: number;
  manufacturerKey: string;
  data: MonitorData[];
}

type MonitorData = {
  sensorId: number;
  temperature: number;
  humidity: number;
}

type MonitorRow = {
  nowUnix: number;
} & MonitorData

type SensorInformation = {
  sensorId: number;
  building: string;
  location: string;
  offSet: string;
}

/**
 * db_putMonitorData
 * This function takes an array of MonitorData and inserts
 * the contents of each array element as a row in the database
 */
export function db_putMonitorData(monitorData: MonitorData[]): void

/**
 * db_getMonitorData
 * Retrieves a range of rows from the database based on time column,
 * in the form of JavaScript Unix time. Outputs the retrieval as MonitorRow[].
 * @param startRangeUnix {number} Unix time. Start time to be selected.
 * @param endRangeUnix {number} Unix time. End time to be selected.
 */
export function db_getMonitorData(startRangeUnix: number, endRangeUnix: number): MonitorRow[];

/**
 * db_getSensorInformation
 * Retrieve all sensor information rows from database.
 * Return retrieval in the form of SensorInformation[].
 */
export function db_getSensorInformation(): SensorInformation[];
