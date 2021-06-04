import React from "react";
import styled from "styled-components";
import { Item } from "semantic-ui-react";

import SingleEntryHistoryItem from "./SingleEntryHistoryItem";
import AxiosInstance from "../AxiosConfig";

const ItemGroup = styled(Item.Group)`
  padding-top: 5vh;
`;

const HistoryList = () => {
  const [userListeningHistory, setUserListeningHistory] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const result = await AxiosInstance.get("/history_list");
        setUserListeningHistory(result.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  if (!userListeningHistory) {
    return null;
  } else {
    return (
      <ItemGroup>
        {userListeningHistory.map((singleDayEntry, index) => {
          return (
            <SingleEntryHistoryItem
              key={index}
              singleDayEntry={singleDayEntry}
            />
          );
        })}
      </ItemGroup>
    );
  }
};

export default HistoryList;
