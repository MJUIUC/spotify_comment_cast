import React, { useState } from "react";
import styled from "styled-components";
import { Button, Item } from "semantic-ui-react";
import AxiosInstance from "../AxiosConfig";

const TrackItemBase = styled(Item)``;

const TrackItem = ({ trackObject }) => {
  const [hydratedTrackData, setHydratedTrackData] = useState(null);

  const fetchTrackInfo = async () => {
    try {
      const result = await AxiosInstance.get("/hydrate_track_from_id", {
        params: { track_id: trackObject.track_id },
      });
      setHydratedTrackData(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    fetchTrackInfo();
  }, []);

  if (!hydratedTrackData) {
    return null;
  } else {
  return (<TrackItemBase>{hydratedTrackData.name}</TrackItemBase>);
  }
};

export default TrackItem;
