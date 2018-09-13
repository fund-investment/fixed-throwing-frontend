import moment from 'moment';
import { queryFundData } from '../services/strategy';

const obtainData = responseText => {
  const dataText = responseText
    .substring(12, responseText.length - 1)
    .replaceAll('content', '"content"')
    .replaceAll('records', '"records"')
    .replaceAll('pages', '"pages"')
    .replaceAll('curpage', '"curpage"');
  const data = JSON.parse(dataText);
  const contentText = data.content;
  let content = contentText.substring(
    contentText.indexOf('<tbody>'),
    contentText.indexOf('</tbody>')
  );
  content = content
    .replaceAll('<tbody>', '')
    .replaceAll("<td class='red unbold'></td>", '')
    .replaceAll("<td class='red unbold'>", '')
    .replaceAll('<td>', '')
    .replaceAll("<td class='tor bold'>", '')
    .replaceAll("<td class='tor bold red'>", '')
    .replaceAll("<td class='tor bold grn'>", '')
    .replaceAll("<td class='tor bold bck'>", '')
    .replaceAll('</td>', ',')
    .replaceAll('<tr>', '')
    .replaceAll('</tr>', '|');
  content = content.split('|').map(oneDayFundData => {
    const oneDayFundDataArray = oneDayFundData.split(',');
    const date = moment(oneDayFundDataArray[0]);
    const unitNetValue = oneDayFundDataArray[1]; // 单位净值
    const accumulatedNetValue = oneDayFundDataArray[2]; // 累计净值
    return { date, unitNetValue, accumulatedNetValue };
  });

  return content;
};

export default {
  namespace: 'strategy',

  state: {
    fundCodes: [
      {
        name: '易方达上证50指数A',
        code: '110003',
      },
      {
        name: '易方达上证中盘ETF联接A',
        code: '110021',
      },
      {
        name: '易方达深证成指ETF联接',
        code: '003524',
      },
      {
        name: '易方达沪深300ETF联接',
        code: '110020',
      },
      {
        name: '易方达沪深300量化增强',
        code: '110030',
      },
      {
        name: '华夏沪深300指数增强A',
        code: '001015',
      },
    ],
    fundDataList: {},
    currentStrategy: {
      fund: {},
      timeRange: {
        startDate: moment('2015-01-01'),
        endDate: moment(),
      },
      period: 'monthly',
      stopProfitStrategy: 'rateOfReturn',
      baseAmount: 200,
    },
    loading: false,
  },

  effects: {
    *fetch({ payload: fundCode }, { call, put, select }) {
      let fundData = yield select(state => state.strategy.fundDataList[fundCode]);
      if (fundData === undefined) {
        const response = yield call(queryFundData, fundCode);
        fundData = obtainData(response.trim());
        yield put({
          type: 'updateFundData',
          payload: {
            fundCode,
            fundData,
          },
        });
      } else {
        yield put({
          type: 'updateCurrentStrategy',
          payload: {
            fundCode,
          },
        });
      }
    },
  },

  reducers: {
    updateFundData(state, { payload }) {
      const { fundCode } = payload;
      return {
        ...state,
        fundDataList: {
          ...state.fundDataList,
          [fundCode]: payload,
        },
        currentStrategy: {
          ...state.currentStrategy,
          fund: state.fundCodes.find(fund => fund.code === fundCode),
        },
      };
    },

    updateCurrentStrategy(state, { payload }) {
      const newFundCode = payload.fundCode;
      const newPeriod = payload.period;
      const newTimeRange = payload.timeRange;
      const newStopProfitStrategy = payload.stopProfitStrategy;
      const newBaseAmount = payload.baseAmount;
      return {
        ...state,
        currentStrategy: {
          ...state.currentStrategy,
          fund: newFundCode
            ? state.fundCodes.find(fund => fund.code === newFundCode)
            : state.currentStrategy.fund,
          timeRange: newTimeRange || state.currentStrategy.timeRange,
          period: newPeriod || state.currentStrategy.period,
          stopProfitStrategy: newStopProfitStrategy || state.currentStrategy.stopProfitStrategy,
          baseAmount: newBaseAmount || state.currentStrategy.baseAmount,
        },
      };
    },
  },
};
