import React from "react";
import styled from "styled-components";
import date from "date-and-time";
import 'date-and-time/plugin/ordinal';
import { Item, Icon, Accordion } from "semantic-ui-react";

date.plugin('ordinal');

const BaseItem = styled(Item)``;

const BaseAccordion = styled(Accordion)`
  background-color: black !important;
  box-shadow: 0 0 0 3px white !important;
`;

const AccordionTitle = styled(Accordion.Title)`
  color: white !important;
`;

const AccordionContent = styled(Accordion.Content)`
  color: white !important;
`;

const SingleEntryHistoryItem = ({ singleDayEntry }) => {
  const [accordionOpen, toggleAccordionOpen] = React.useState(true);
  
  React.useEffect(() => {
    console.log(singleDayEntry);
  }, []);

  return (
    <BaseItem>
      <BaseAccordion styled>
        <AccordionTitle
          active={accordionOpen}
          onClick={() => {
            toggleAccordionOpen(!accordionOpen);
          }}
        >
          <Icon name="dropdown" />
          Tracks From {singleDayEntry.date}
        </AccordionTitle>
        <AccordionContent active={accordionOpen}>
          <Item.Group>
          {singleDayEntry.hydrated_track_data.map((track, index) => {
            return <TrackItem track={track} key={index} itemNumber={index + 1}/>;
          })}
          </Item.Group>
        </AccordionContent>
      </BaseAccordion>
    </BaseItem>
  );
};

const TrackItemHeader = styled(Item.Header)`
  color: white !important;
`;

const TrackItemArtist = styled.p`
  color: white;
`;

const TrackItem = ({ track }) => {

  return (
    <Item>
      <Item.Image size="tiny" src={track.track_data.album.images[0].url}/>
      <Item.Content>
        <TrackItemHeader content={track.track_data.name} />
        <Item.Description>
          {track.track_data.artists.map((artist, index) => {
            return (
              <div key={index}>
                <TrackItemArtist>{artist.name}</TrackItemArtist>
              </div>
            );
          })}
        </Item.Description>
      </Item.Content>
    </Item>
  );
};

export default SingleEntryHistoryItem;
