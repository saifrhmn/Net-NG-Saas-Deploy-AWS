import { Input } from '@angular/core';

export enum RecordStatus {
  Active = 1,
  Inactive = 0,
  // Delete = 9,
}

export enum ResponseStatus {
  success = 200,
  fail = 404,
  clientError = 400,
  Error = 400,
  warning = 205,
  internalServerError = 500,
  info = 300,
  unAuthorize = 401
}

export enum CommonStatus {
  Draft = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

export enum JorneyPlanType {
  Planned = 0,
  Adhoc = 1
}

export enum PurposeOptionType {
  Input = 0,
  Dropdown = 1
}

export enum Priority {
  low = 0,
  medium = 1,
  high = 2,
  urgent = 3,
  important = 4
}

export enum DataType {
  Image = 0,
  Text = 1,
  Stream = 2,
  Video = 3,
}

export let monthList = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export enum MonthListEnum {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12
}

export enum WeekList {
  'Sun' = 1,
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
};

export enum WeekFullNameList {
  'Sunday' = 1,
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
};

export enum Gender {
  Male = 0,
  Female
}

export enum KeyBoardKey {
  KEY_A = 'A',
  KEY_C = 'C',
  KEY_V = 'V',
  KEY_D = 'D',
  KEY_Z = 'Z',
  KEY_Y = 'Y',
  KEY_PAGE_UP = 'PAGEUP',
  KEY_PAGE_DOWN = 'PAGEDOWN',
  KEY_TAB = 'TAB',
  KEY_LEFT = 'ARROWLEFT',
  KEY_UP = 'ARROWUP',
  KEY_RIGHT = 'ARROWRIGHT',
  KEY_DOWN = 'ARROWDOWN',
  KEY_F2 = 'F2',
  KEY_BACKSPACE = 'BACKSPACE',
  KEY_ESCAPE = 'ESCAPE',
  KEY_SPACE = ' ',
  KEY_DELETE = 'DELETE',
  KEY_HOME = 'HOME',
  KEY_END = 'END',
}

export enum ClubSupremeEnum {
  None = 0,
  Gold = 1,
  Platinum = 2,
  PlatinumPlus = 3,
}

export enum BussinesCategoryEnum {
  None = 0,
  Exclusive = 1,
  NonExclusive = 2,
  NonAPNonExclusive = 3,
  NewDealer = 4,
}


export const PAGE_SIZE = 100;
export const DEFAULT_DATE = "1900-01-01T00:00:00";
export const ROOM = "KJ Housing";

