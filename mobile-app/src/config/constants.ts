// App Constants
export const STORAGE_KEYS = {
  TOKEN: '@snt_eid_token',
  USER: '@snt_eid_user',
  REMEMBER_EMAIL: '@snt_eid_remember_email',
};

export const EMIRATES_ID_REGEX = /^784-\d{4}-\d{7}-\d{1}$/;

export const EID_STEPS = {
  PROCESSING: 7,          // Emirates ID Application/Processing
  RECEIVED: 9,            // EID Received from Courier
  DELIVERED: 10,          // EID Delivered to Customer
};

export const EID_TAB_NAMES = {
  PROCESSING: 'Processing',
  RECEIVE: 'Receive',
  DELIVER: 'Deliver',
};

export default {
  STORAGE_KEYS,
  EMIRATES_ID_REGEX,
  EID_STEPS,
  EID_TAB_NAMES,
};
