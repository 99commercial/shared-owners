import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/endpoints';
import { PROPERTY_OWNERS } from '../data/propertyOwners';

export const USER_DASHBOARD_KEY = PROPERTY_OWNERS.user.keys.dashboard;
export const USER_PROPERTIES_KEY = PROPERTY_OWNERS.user.keys.list;
export const userPropertyKey = PROPERTY_OWNERS.user.keys.item;

export default function useUserDashboard() {
  return useQuery({
    queryKey: USER_DASHBOARD_KEY,
    queryFn: () => userApi.getDashboard().then((r) => r.data.data),
  });
}
