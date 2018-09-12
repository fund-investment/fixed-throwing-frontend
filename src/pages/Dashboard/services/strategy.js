import { stringify } from 'qs';
import request from '@/utils/request';

export async function queryFundData(fundCode) {
  return request(
    `/f10/F10DataApi.aspx?${stringify({
      type: 'lsjz',
      code: fundCode,
      page: 1,
      per: 7300,
      sdate: '',
      date: '',
    })}`
  );
}
