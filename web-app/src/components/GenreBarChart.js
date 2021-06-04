import React, { useState } from "react";
import styled from "styled-components";
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
  background-color: ${(props) => (props.color)};
  min-width: 10vw;
  min-height: 10vh;
  border-radius: 5px;
  padding: 1em;
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const { genre, occurances } = payload[0].payload;
    return (
      <CustomTooltipBaseContainer color={payload[0].color}>
        <h4>Genre:</h4>
        <h2>{genre}</h2>
      </CustomTooltipBaseContainer>
    );
  } else {
    return null;
  }
};

const GenreBarChart = ({ uniqueGenresNumber, genreChartData }) => {
  const [chartData, setChartData] = useState(genreChartData);

  if (!chartData) {
    return null;
  } else {
    return (
      <BarChart width={800} height={250} data={chartData}>
        <XAxis dataKey="genre" hide />
        <YAxis />
        <Tooltip content={CustomTooltip} />
        <Bar dataKey="occurances" fill="#fff" />
      </BarChart>
    );
  }
};

export default GenreBarChart;
