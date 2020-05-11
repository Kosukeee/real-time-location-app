import React, { useState, useEffect, useContext } from "react";
import ReactMapGL, { NavigationControl, Popup } from 'react-map-gl';
import Context from '../context';
import Blog from './Blog';
import Marker from './Marker';
import { useClient } from '../client';
import { GET_PINS_QUERY } from '../graphql/queries';
import { DELETE_PIN_MUTATION } from '../graphql/mutations';
import { withStyles } from "@material-ui/core/styles";
import differenceInMinutes from 'date-fns/difference_in_minutes';
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
const mapboxApiToken = 'pk.eyJ1Ijoia29zdWtlbXVyYW1hdHN1IiwiYSI6ImNqdTR4azhudzBpZnozeW8ycjRkZDl4bWwifQ.gbUCTqtCh0l6WBj9K5mSfQ';
const mapStyleUrl = 'mapbox://styles/mapbox/streets-v9';

const INITIAL_VIEWPORT = {
  width: '100vw',
  height: 'calc(100vh - 64px)',
  latitude: 37.7577,
  longitude: -122.4376,
  zoom: 13
};

const Map = ({ classes }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT);
  const [userPosition, setUserPosition] = useState(null);
  const [popup, setPopup] = useState(null);

  const getUserPosition = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;

        setViewport({ ...viewport, latitude, longitude });
        setUserPosition({ latitude, longitude });
      });
    }
  }

  const handleMapClick = ({ lngLat, leftButton }) => {
    if (!leftButton) return;
    if (!state.draft) {
      dispatch({ type: 'CREATE_DRAFT' })
    }
    const [ longitude, latitude ] = lngLat;
    dispatch({
      type: 'UPDATE_DRAFT_LOCATION',
      payload: { longitude, latitude }
    });
  }

  const getPins = async () => {
    const { getPins } = await client.request(GET_PINS_QUERY);

    dispatch({ type: 'GET_PINS', payload: getPins });
  };

  const highlightNewPin = pin => {
    const isNewPin = differenceInMinutes(Date.now(), Number(pin.createdAt)) <= 30;

    return isNewPin ? 'limegreen' : 'darkblue';
  }

  const handleSelectPin = pin => {
    setPopup(pin);
    dispatch({ type: 'SET_PIN', payload: pin });
  }

  const isAuthor = () => state.currentUser._id === popup.author._id;

  const handleDeletePin = async pin => {
    const variables = { pinId: pin._id }
    const { deletePin } = await client.request(DELETE_PIN_MUTATION, variables);

    dispatch({ type: 'DELETE_PIN', payload: deletePin });
    setPopup(null);
  }

  useEffect(() => {
    getUserPosition();
  }, []);

  useEffect(() => {
    getPins();
  }, []);

  return (
    <div className={classes.root}>
      <ReactMapGL
        mapStyle={mapStyleUrl}
        mapboxApiAccessToken={mapboxApiToken}
        onViewportChange={newviewport => setViewport(newviewport)}
        onClick={handleMapClick}
        {...viewport}
      >
        <div className={classes.navigationControl}>
          <NavigationControl
            onViewportChange={newviewport => setViewport(newviewport)}
          />
        </div>
        {userPosition && (
          <Marker latitude={userPosition.latitude} longitude={userPosition.longitude} pinColor="red" />
        )}
        {state.draft && (
          <Marker latitude={state.draft.latitude} longitude={state.draft.longitude} pinColor="hotpink" />
        )}
        {state.pins.map(pin => (
          <Marker key={pin._id} latitude={pin.latitude} longitude={pin.longitude} pinColor={highlightNewPin(pin)} handlePinClick={handleSelectPin} pin={pin} />
        ))}
        {popup && (
          <Popup
            anchor="top"
            latitude={popup.latitude}
            longitude={popup.longitude}
            closeOnClick={false}
            onClose={() => setPopup(null)}
          >
            <img
              className={classes.popupImage}
              src={popup.image}
              alt={popup.title}
            />
            <div className={classes.popupTab}>
              <Typography>
                {popup.latitude.toFixed(6)}, {popup.longitude.toFixed(6)}
              </Typography>
              {isAuthor() && (
                <Button onClick={() => handleDeletePin(popup)}>
                  <DeleteIcon className={classes.deleteIcon} />
                </Button>
              )}
            </div>
          </Popup>
        )}
      </ReactMapGL>
      <Blog />
    </div>
  );
};

const styles = {
  root: {
    display: "flex"
  },
  rootMobile: {
    display: "flex",
    flexDirection: "column-reverse"
  },
  navigationControl: {
    position: "absolute",
    top: 0,
    left: 0,
    margin: "1em"
  },
  deleteIcon: {
    color: "red"
  },
  popupImage: {
    padding: "0.4em",
    height: 200,
    width: 200,
    objectFit: "cover"
  },
  popupTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
  }
};

export default withStyles(styles)(Map);
