import React from 'react';
import { Marker as ReactMapGLMarker } from 'react-map-gl';
import PinIcon from './PinIcon';

const Marker = ({ latitude, longitude, pinColor, handlePinClick=null, pin }) => {
  return (
    <ReactMapGLMarker
      latitude={latitude}
      longitude={longitude}
      offsetTop={-37}
      offsetLeft={-17}
    >
      <PinIcon size={40} color={pinColor} onClick={e => handlePinClick ? handlePinClick(pin) : e.preventDefault()} />
    </ReactMapGLMarker>
  )
};

export default Marker;