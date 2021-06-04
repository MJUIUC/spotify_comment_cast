import React, { useState } from "react";
import styled from "styled-components";
import AxiosInstance from "../AxiosConfig";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

const CustomTooltipBaseContainer = styled.div`
  background-color: ${(props) => props.color};
  min-width: 10vw;
  min-height: 10vh;
  border-radius: 5px;
  padding: 1em;
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const { artist_id, occurances } = payload[0].payload;
    return (
      <CustomTooltipBaseContainer
        color={payload[0].color}
      ></CustomTooltipBaseContainer>
    );
  } else {
    return null;
  }
};

const TracksGraph = ({ topFive, graphData, containerDimensions }) => {
  const [chartData, setChartData] = useState(graphData);
  const [hydratedTrackData, setHydratedTrackData] = useState(null);

  const fetchHydratedTrackData = async () => {
    try {
      const result = await AxiosInstance.get("/hydrate_tracks_array", {
        params: { top_five_tracks: graphData },
      });
      console.log(result);
      setHydratedTrackData(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    fetchHydratedTrackData();
  }, []);

  if (!chartData) {
    return null;
  } else {
    return (
      <BarChart
        width={containerDimensions.width}
        height={containerDimensions.height}
        data={chartData}
      >
        <XAxis dataKey="genre" hide />
        <YAxis />
        {/* <Tooltip content={CustomTooltip} /> */}
        <Bar dataKey="occurances" fill="#fff" />
      </BarChart>
    );
  }
};

export default TracksGraph;
