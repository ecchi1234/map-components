import React, { ReactNode } from 'react';
import GoogleMapReact, { Props } from 'google-map-react';

export interface GoogleMapProps extends Props {
  children?: ReactNode | ReactNode[];
  apiKey: string;
}
function GoogleMap(props: GoogleMapProps) {
  return (
    <GoogleMapReact
      bootstrapURLKeys={{
        key: props.apiKey,
        libraries: ['places', 'geometry'],
      }}
      yesIWantToUseGoogleMapApiInternals
      {...props}
    >
      {props.children}
    </GoogleMapReact>
  );
}

export default GoogleMap;
