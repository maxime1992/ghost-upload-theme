import { ClientAuth } from './api.interface';

// @todo this function is not working once the app is built
// displaying the variable shows that they are somehow uglified
// in the meantime, generating the string directly with the following
// uncommented function
// export const formatAuthParams = (clientAuth: ClientAuth): string => {
//   return Object.values(clientAuth)
//     .reduce(
//       (acc: string[], [key, value]: [string, string]) => [
//         ...acc,
//         `${key}=${encodeURIComponent(value)}`,
//       ],
//       []
//     )
//     .join('&');
// };

export const formatAuthParams = (clientAuth: ClientAuth): string => {
  return `grant_type=${'password'}&username=${encodeURIComponent(
    clientAuth.username
  )}&password=${encodeURIComponent(
    clientAuth.password
  )}&client_id=${encodeURIComponent(
    clientAuth.client_id
  )}&client_secret=${encodeURIComponent(clientAuth.client_secret)}`;
};
