import React from "react";
import "./Bar.scss";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BarCharte = ({ data }) => {
  return (
    <div className="bar">
      <ResponsiveContainer width="100%" aspect={2 / 1}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#355F2E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarCharte;




