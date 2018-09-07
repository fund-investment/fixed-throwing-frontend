import React, { Component } from 'react';
import { connect } from 'dva';
import { Card, DatePicker, Select, InputNumber } from 'antd';

import ReactEcharts from 'echarts-for-react';
import moment from 'moment';
import styles from './Analysis.less';

const { RangePicker } = DatePicker;
const { Option } = Select;
const PREPOSE_DAYS = 45;

const grawOption = (currentStrategy, fundDataList) => {
  const currentFundDataList = fundDataList[currentStrategy.fund.code];

  const dataWithInTimeRange = currentFundDataList
    ? currentFundDataList.fundData
        .filter(fundData => {
          const { startDate, endDate } = currentStrategy.timeRange;
          return fundData.date.isBetween(moment(startDate).subtract(PREPOSE_DAYS, 'days'), endDate);
        })
        .sort((a, b) => (a.date.isAfter(b.date) ? 1 : -1))
    : [];

  const xAxisData = dataWithInTimeRange.map(fund => fund.date.format('YYYY/MM/DD'));

  // 持仓
  let buyDate = moment(currentStrategy.timeRange.startDate);
  if (dataWithInTimeRange[0] && dataWithInTimeRange[0].date.isAfter(buyDate)) {
    buyDate = moment(dataWithInTimeRange[0].date);
  }
  let buyFunds = dataWithInTimeRange.filter(fund => {
    if (fund.date.isSame(buyDate) || fund.date.isAfter(buyDate)) {
      switch (currentStrategy.period) {
        case 'weekly':
          buyDate = buyDate.add(1, 'weeks');
          break;
        case 'twoWeekly':
          buyDate = buyDate.add(2, 'weeks');
          break;
        case 'monthly':
          buyDate = buyDate.add(1, 'months');
          break;
        default:
          break;
      }
      return true;
    }
    return false;
  });

  // 定投金额
  // 累计投入|totalInvestment
  // 买入份额|portion
  // 累计份额|totalPortion
  // （累计）持仓成本|cost
  // （累计）持仓收益率|yieldRate
  // 止盈参考线，误，目前写死按收益率15% TODO | targetProfit
  // 累计定投次数 |buyTimes
  let totalI = 0;
  let totalP = 0;
  buyFunds = buyFunds.map((fund, index) => {
    const investment = currentStrategy.baseAmount;
    let totalInvestment = investment;
    const portion = investment / parseFloat(fund.unitNetValue);
    let totalPortion = portion;
    if (index !== 0) {
      totalInvestment = investment + totalI;
      totalI = totalInvestment;
      totalPortion = portion + totalP;
      totalP = totalPortion;
    } else {
      totalI = investment;
      totalP = portion;
    }
    const cost = totalInvestment / totalPortion;
    const yieldRate = parseFloat(fund.unitNetValue) - cost / parseFloat(fund.unitNetValue);
    const targetProfit = 1.15 * cost;

    return {
      ...fund,
      investment,
      totalInvestment,
      portion,
      totalPortion,
      cost,
      yieldRate,
      targetProfit,
      buyTimes: index + 1,
    };
  });

  // （每日）收益 |earnings
  // （每日）收益率 |earningsRate
  // 持仓天数 |fatalism
  const everyFundData = dataWithInTimeRange.map(fund => {
    const theLastTrade = buyFunds.find((buyFund, index) => {
      const isLast =
        (buyFund.date.isBefore(fund.date) && buyFunds[index + 1] === undefined) ||
        (buyFund.date.isBefore(fund.date) && buyFunds[index + 1].date.isAfter(fund.date));
      return buyFund.date.isSame(fund.date) || isLast;
    });

    const earnings = theLastTrade
      ? theLastTrade.totalPortion * fund.unitNetValue - theLastTrade.totalInvestment
      : 0;
    const earningsRate = theLastTrade ? (earnings / theLastTrade.totalInvestment) * 100 : 0;
    const dateDiffFromBuyDay = fund.date.diff(buyFunds[0].date, 'days');
    return {
      ...fund,
      fatalism: dateDiffFromBuyDay >= 0 ? dateDiffFromBuyDay : 0,
      buyTimes: theLastTrade ? theLastTrade.buyTimes : 0,
      earnings,
      earningsRate,
    };
  });
  const yAxisBuyIn = buyFunds.map(fund => {
    return [fund.date.format('YYYY/MM/DD'), fund.unitNetValue];
  });
  const yAxisDataUnit = dataWithInTimeRange.map(fund => fund.unitNetValue);
  const yAxisCost = buyFunds.map(fund => [fund.date.format('YYYY/MM/DD'), fund.cost]);
  const yAxisTargetProfit = buyFunds.map(fund => [
    fund.date.format('YYYY/MM/DD'),
    fund.targetProfit,
  ]);
  const yAxisEarnings = everyFundData.map(fund => [fund.date.format('YYYY/MM/DD'), fund.earnings]);
  const yAxisEarningsRate = everyFundData.map(fund => [
    fund.date.format('YYYY/MM/DD'),
    fund.earningsRate,
  ]);
  const yAxisTotalInvestment = buyFunds.map(fund => [
    fund.date.format('YYYY/MM/DD'),
    fund.totalInvestment,
  ]);
  const yAxisTotalPortion = buyFunds.map(fund => [
    fund.date.format('YYYY/MM/DD'),
    fund.totalPortion,
  ]);
  const yAxisFatalism = everyFundData.map(fund => [fund.date.format('YYYY/MM/DD'), fund.fatalism]);
  const yAxisBuyTimes = everyFundData.map(fund => [fund.date.format('YYYY/MM/DD'), fund.buyTimes]);

  return {
    title: {
      text: '策略分析',
      subtext: currentStrategy.fund.name,
    },
    tooltip: {
      // 鼠标悬停提示
      trigger: 'axis',
    },
    legend: {
      // 图例
      data: ['基金净值', '买入', '持仓成本', '止盈参考', '收益率', '持仓收益'],
    },
    axisPointer: {
      // 全局鼠标悬停联动
      link: {
        xAxisIndex: 'all',
      },
    },
    dataZoom: [
      {
        // 时间范围选择器
        show: true,
        realtime: true,
        xAxisIndex: [0, 1],
      },
      {
        type: 'inside',
        realtime: true,
        xAxisIndex: [0, 1],
      },
    ],
    grid: [
      {
        // 多表格
        left: 50,
        right: 50,
        height: '20%',
      },
      {
        left: 50,
        right: 50,
        top: '32%',
        height: '25%',
      },
      {
        left: 50,
        right: 50,
        top: '62%',
        height: '25%',
      },
      {
        left: 50,
        right: 50,
        top: '90%',
        height: '7%',
      },
    ],
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      {
        gridIndex: 1,
        type: 'category',
        boundaryGap: false,
        axisLine: {
          onZero: true,
        },
        data: xAxisData,
      },
      {
        gridIndex: 2,
        type: 'category',
        boundaryGap: false,
        axisLine: {
          onZero: true,
        },
        data: xAxisData,
      },
      {
        gridIndex: 3,
        type: 'category',
        boundaryGap: false,
        axisLine: {
          onZero: true,
        },
        data: xAxisData,
      },
    ],
    yAxis: [
      {
        type: 'value',
        min(value) {
          return (value.min - 0.01).toFixed(2);
        },
      },
      {
        name: '收益率',
        type: 'value',
        position: 'left',
        gridIndex: 1,
        axisLabel: {
          formatter: '{value} %',
        },
      },
      {
        name: '持仓收益',
        type: 'value',
        position: 'right',
        gridIndex: 1,
        axisLabel: {
          formatter: '{value} 元',
        },
      },
      {
        name: '份额',
        type: 'value',
        position: 'left',
        gridIndex: 2,
        axisLabel: {
          formatter: '{value} 份',
        },
      },
      {
        name: '持仓',
        type: 'value',
        position: 'right',
        gridIndex: 2,
        axisLabel: {
          formatter: '{value} 元',
        },
      },
      {
        type: 'value',
        position: 'left',
        gridIndex: 3,
        axisLabel: {
          formatter: '{value} 天',
        },
      },
      {
        type: 'value',
        position: 'right',
        gridIndex: 3,
        axisLabel: {
          formatter: '{value} 次',
        },
      },
    ],
    series: [
      {
        name: '基金净值',
        type: 'line',
        yAxisIndex: 0,
        xAxisIndex: 0,
        data: yAxisDataUnit,
      },
      {
        name: '买入',
        type: 'scatter',
        yAxisIndex: 0,
        xAxisIndex: 0,
        symbol: 'triangle',
        symbolSize: '10',
        showAllSymbol: true,
        lineStyle: {
          normal: {
            color: 'green',
            width: 2,
          },
        },
        itemStyle: {
          normal: {
            borderWidth: 3,
            borderColor: 'yellow',
            color: 'blue',
          },
        },
        data: yAxisBuyIn,
      },
      {
        name: '持仓成本',
        type: 'line',
        yAxisIndex: 0,
        xAxisIndex: 0,
        step: 'end',
        data: yAxisCost,
      },
      {
        name: '止盈参考',
        type: 'line',
        yAxisIndex: 0,
        xAxisIndex: 0,
        step: 'end',
        lineStyle: {
          normal: {
            type: 'dotted',
          },
        },
        data: yAxisTargetProfit,
      },
      {
        name: '收益率',
        type: 'line',
        yAxisIndex: 1,
        xAxisIndex: 1,
        data: yAxisEarningsRate,
      },
      {
        name: '持仓收益',
        type: 'line',
        yAxisIndex: 2,
        xAxisIndex: 1,
        data: yAxisEarnings,
      },
      {
        name: '累计份额',
        type: 'line',
        yAxisIndex: 3,
        xAxisIndex: 2,
        data: yAxisTotalPortion,
      },
      {
        name: '累计持仓',
        type: 'line',
        yAxisIndex: 4,
        xAxisIndex: 2,
        data: yAxisTotalInvestment,
      },
      {
        name: '持仓天数',
        type: 'line',
        yAxisIndex: 5,
        xAxisIndex: 3,
        data: yAxisFatalism,
      },
      {
        name: '买入次数',
        type: 'line',
        step: 'end',
        yAxisIndex: 6,
        xAxisIndex: 3,
        data: yAxisBuyTimes,
      },
    ],
  };
};

@connect(({ strategy, loading }) => ({ strategy, loading: loading.effects['strategy/fetch'] }))
export default class Analysis extends Component {
  handleChangeFund = value => {
    const { dispatch } = this.props;
    dispatch({ type: 'strategy/fetch', payload: value });
  };

  handleChangePeriod = value => {
    const { dispatch } = this.props;
    dispatch({
      type: 'strategy/updateCurrentStrategy',
      payload: {
        period: value,
      },
    });
  };

  handleChangeTimeRange = date => {
    const { dispatch } = this.props;
    dispatch({
      type: 'strategy/updateCurrentStrategy',
      payload: {
        timeRange: {
          startDate: date[0],
          endDate: date[1],
        },
      },
    });
  };

  handleChangeBaseAmount = value => {
    const { dispatch } = this.props;
    dispatch({
      type: 'strategy/updateCurrentStrategy',
      payload: {
        baseAmount: value,
      },
    });
  };

  handleChangeStopProfitStrategy = value => {
    const { dispatch } = this.props;
    dispatch({
      type: 'strategy/updateCurrentStrategy',
      payload: {
        stopProfitStrategy: value,
      },
    });
  };

  render() {
    const { strategy, loading } = this.props;
    const option = grawOption(strategy.currentStrategy, strategy.fundDataList);
    return (
      <div>
        <Select
          placeholder="选择基金"
          style={{
            width: 220,
          }}
          onChange={this.handleChangeFund}
        >
          {strategy.fundCodes.map(f => (
            <Option key={f.code}>{f.name}</Option>
          ))}
        </Select>

        <Select
          placeholder="定投策略"
          style={{
            width: 150,
          }}
          onChange={this.handleChangePeriod}
          allowClear
        >
          <Option key="weekly">每周买入</Option>
          <Option key="twoWeekly">每双周买入</Option>
          <Option key="monthly">每月买入</Option>
        </Select>
        <RangePicker
          defaultValue={[
            strategy.currentStrategy.timeRange.startDate,
            strategy.currentStrategy.timeRange.endDate,
          ]}
          onChange={this.handleChangeTimeRange}
        />
        <Select
          placeholder="止盈策略(默认15%)"
          style={{
            width: 180,
          }}
          onChange={this.handleChangeStopProfitStrategy}
          allowClear
        >
          <Option key="annualizedRateOfReturn">年化收益率</Option>
          <Option key="rateOfReturn">收益率(15%)</Option>
          <Option key="averageLine">均线</Option>
        </Select>
        <span>基础金额</span>
        <InputNumber
          defaultValue={strategy.currentStrategy.baseAmount}
          onChange={this.handleChangeBaseAmount}
        />
        <Card
          loading={loading}
          className={styles.offlineCard}
          bordered={false}
          bodyStyle={{
            padding: '0 0 32px 0',
          }}
          style={{
            marginBottom: 32,
          }}
        >
          <ReactEcharts
            option={option}
            style={{
              height: '1500px',
              width: '100%',
            }}
            className="react_for_echarts"
          />
        </Card>
      </div>
    );
  }
}
