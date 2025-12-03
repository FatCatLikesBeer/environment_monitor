import { Chart } from "chart.js/auto";
import type { ChartItem } from "chart.js/auto";
import data from "./data.ts";

const main = () => {
  const ctx = document.getElementById("myChart") as ChartItem;
  const labels: string[] = [];
  const dataSet_0 = {
    label: "",
    data: [],
    borderWidth: 1,
  };
  const dataSet_1 = {
    label: "",
    data: [],
    borderWidth: 1,
  };
  const dataSet_2 = {
    label: "",
    data: [],
    borderWidth: 1,
  };

  data.forEach((elem) => {
    labels.push(elem.date);
    if (!dataSet_0.label) {
      dataSet_0.label = elem.data[0].name;
    }
    if (!dataSet_1.label) {
      dataSet_1.label = elem.data[1].name;
    }
    if (!dataSet_2.label) {
      dataSet_2.label = elem.data[2].name;
    }
    dataSet_0.data.push(elem.data[0].temperature);
    dataSet_1.data.push(elem.data[1].temperature);
    dataSet_2.data.push(elem.data[2].temperature);
  });

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [dataSet_1, dataSet_2],
    },
    // options: {
    //   scales: {
    //     y: {
    //       beginAtZero: true,
    //     },
    //   },
    // },
  });
};

document.addEventListener("DOMContentLoaded", main);

// (alias) const data: {
//     key: string;
//     device_id: string;
//     data: {
//         name: string;
//         temperature: number;
//         humidity: number;
//     }[];
//     date: string;
// }[]
