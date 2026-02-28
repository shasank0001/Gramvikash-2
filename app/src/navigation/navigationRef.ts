import React from 'react';

export type RootTabParamList = {
  Feed: undefined;
  Mandi: undefined;
  Resources: undefined;
  AICoPilot: undefined;
  Schemes: undefined;
  SOS: undefined;
  Profile: undefined;
};

export const navigationRef = React.createRef<any>();

export function navigate(name: keyof RootTabParamList, params?: object) {
  navigationRef.current?.navigate(name, params);
}
