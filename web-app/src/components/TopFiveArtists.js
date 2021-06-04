import React, { useState } from "react";
import styled from "styled-components";
import AxiosInstance from "../AxiosConfig";
import { Item } from "semantic-ui-react";

const BaseItemGroup = styled(Item.Group)`
  margin-top: 6vh !important;
`;

const TopFiveArtists = ({ topFiveArtists, trackHistogram }) => {
  const [hydratedArtistData, setHydratedArtistData] = useState(null);

  const fetchHydrateArtistData = async () => {
    try {
      const result = await AxiosInstance.get("/top_five_artists_last_week");
      console.log(result);
      setHydratedArtistData(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  React.useEffect(() => {
    fetchHydrateArtistData();
  }, []);

  if (!hydratedArtistData) {
    return null;
  } else {
    return (
      <BaseItemGroup>
        {hydratedArtistData.map((artistObject, index) => {
          console.log(artistObject);
          const { artist } = artistObject;
          return (
            <Item key={index}>
              <Item.Image size="small" src={artist.images[0].url} />
              <Item.Content>
                <Item.Header>{artist.name}</Item.Header>
              </Item.Content>
            </Item>
          );
        })}
      </BaseItemGroup>
    );
  }
};

export default TopFiveArtists;
