import { Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";

// Goal: To update the portfolio whenever a purchase / sell event that leads to a new DCA defining event happens
// 1. Get all the events based on coinId from event table
// 2. Retrieve all the latest events from target coin, ranging from the latest DCA defining event till the most recent buy event
// 3. From the list, 
// 3.1 calculate total bought and total sold by summing up all bought and sold into constants (totalBuyQuantity and totalSellQuantity)
// 3.2 calculate the currentAmountOwned by summing up totalBuyQuantity with totalSellQuantity
// 3.3 calculate the currentDollarCostAverage by FORMULA 1 in excel
// 3.4 calculate the currentDollarSoldAverage by FORMULA 2 in excel
// 3.5 calculate the realisedProfitLossPercentage by FORMULA 4 in excel
// 4. Account for all denominator = 0 edge case, buy = sell and for extra cases where there are none of any of the events
// 5. Update the target coin using coinId with the newly calculated values

export default class GeneralPortfolioUpdate{
  private logger = new Logger('GeneralPortfolioUpdate');
  async generalPortfolioUpdateFunction(newEvent: Partial<BuySellCoinEventEntity>){

    const {
      coinId,
      eventType,
      buyQuantity,
      aggregatePrice,
      sellQuantity,
      marketPrice,
      networkFee,
      exchangePremium,
      eventDate
    } = newEvent

    // 1. Make a single call to DB to retrieve all events for specific coinId
    const coinEventsList: BuySellCoinEvent[] = 
    await BuySellCoinEvent.query()
      .where({coinId})
    this.logger.log(`coinEventsList: ${JSON.stringify(coinEventsList)}`)

    // 2. Get the latest defining dca event for a specific coin (based on coinId) 
    // get a list of all DCA Defining Events
    let listOfDCADefiningEvents: BuySellCoinEvent[] = []
    for(let i = 0; i < coinEventsList.length; i++){
      if(coinEventsList[i].eventType === EventType.RecentDCADefiningEventType){
        listOfDCADefiningEvents.push(coinEventsList[i])
      }
    }
    this.logger.log(`listOfDCADefiningEvents: ${JSON.stringify(listOfDCADefiningEvents)}`);

    // get the latest DCA Defining Event from the listOfDCADefiningEvents using eventDate
    let latestDefiningDCAEvent: BuySellCoinEvent =
      listOfDCADefiningEvents.reduce((previous, current) => {
        return new Date(previous.eventDate).getTime() > new Date(current.eventDate).getTime() ? previous : current;
      });
    this.logger.log(`latestDefiningDCAEvent: ${JSON.stringify(latestDefiningDCAEvent)}`);

    // 3.1 Getting the buys and sells quantity of a specific coin (MIGHT NOT BE REQUIRED AS DCA EVENTS COULD REPLACE THIS)
    let buySellEventList:BuySellCoinEvent[] = [];
    for(let event of coinEventsList){
      if(event.eventType !== EventType.RecentDCADefiningEventType){
        buySellEventList.push(event)
      }
    }

    // 3.2 Set the calculatedCurrentAmountOwned 
    let totalBuyQuantity: number = 0;
    let totalSellQuantity: number = 0;
    for(let buySellEvent of buySellEventList){
      totalBuyQuantity += Number(buySellEvent.buyQuantity);
      totalSellQuantity += Number(buySellEvent.sellQuantity);
    }
    let calculatedCurrentAmountOwned: number = totalBuyQuantity - totalSellQuantity;

    // 3.3 Calculate the currentDollarCostAverage (calculatedCurrentDollarCostAverage)
    // only require either the dca defining event and subsequent buy events or the dca defining event alone
    // Get the DCA defining event and buy events which are equal or greater than the latest defining DCA event's date
    // MIGHT JUST CHANGE calculatedCurrentAmountOwned TO TOTAL OF buyQuantity OF EACH recentEvent
    const recentEventsList: BuySellCoinEvent[] = []
    for(let i = 0; i < coinEventsList.length; i++){
      if(coinEventsList[i].eventDate >= latestDefiningDCAEvent.eventDate && 
        coinEventsList[i].eventType !== EventType.SellEventType){
          recentEventsList.push(coinEventsList[i])
      }
    }
    this.logger.log(`recentEventsList: ${JSON.stringify(recentEventsList)}`);

    let totalWeightedPurchases: number = 0;
    let calculatedCurrentDollarCostAverage: number = 0;
    for(let recentEvent of recentEventsList){
      totalWeightedPurchases += (recentEvent.buyQuantity * recentEvent.aggregatePrice);
    }
    if(calculatedCurrentAmountOwned !== 0){
      calculatedCurrentDollarCostAverage = totalWeightedPurchases / calculatedCurrentAmountOwned
    }
    this.logger.log(`calculatedCurrentDollarCostAverage: ${calculatedCurrentDollarCostAverage}`)

    // 3.4 Calculate the currentDollarSoldAverage
    // Only require the sell events hence get all sell events for this coin
    // MIGHT JUST CHANGE totalSellQuantity TO TOTAL OF sellQuantity OF EACH sellEvent
    const allSoldEventsList: BuySellCoinEvent[] = [];
      for(let i = 0; i < coinEventsList.length; i++){
        if(coinEventsList[i].eventType === EventType.SellEventType){
          allSoldEventsList.push(coinEventsList[i])
        }
      }
    this.logger.log(`allSoldEventsList: ${JSON.stringify(allSoldEventsList)}`)

    let totalWeightedSells: number = 0;
    let calculatedDollarSoldAverage: number = 0;
    for(let sellEvent of allSoldEventsList){
      totalWeightedSells += (sellEvent.sellQuantity * sellEvent.aggregatePrice);
    }
    if(totalSellQuantity !== 0){
      calculatedDollarSoldAverage = totalWeightedSells / totalSellQuantity;
    }

  // 3.5 Calculate realisedProfitLossPercentage (if a sell event is present in coinEventList)
  // Get every sell event's
  // - amount of coins sold (SC)
  // - aggregate price of coins sold (essentially the effective selling price per coin) (DSA)
  // - aggregate price of coins bought preceeding sell event 
  // (retrieved from the aggregate price of recent defined DCA after the sell event) (DCA)
    let totalPLPercentageNumerator: number = 0;
    let totalPLPercentageDenominator: number = 0;
    let calculatedRealisedProfitLossPercentage: number = 0;
    if(allSoldEventsList.length > 0){
      for(let sellEvent of allSoldEventsList){
          let correspondingDefinedDCAEvent: BuySellCoinEvent | null = null;
          for(let definedDCAEvent of listOfDCADefiningEvents){
            this.logger.log(`definedDCAEvent date === sellEvent date? : ${new Date(definedDCAEvent.eventDate).getTime()  === new Date(sellEvent.eventDate).getTime()}`)
            if(new Date(definedDCAEvent.eventDate).getTime() === new Date (sellEvent.eventDate).getTime()){
              correspondingDefinedDCAEvent = definedDCAEvent
            }
          }
          this.logger.log(`sellEventFromLoop: ${JSON.stringify(sellEvent)}`)
          this.logger.log(`correspondingDefinedDCAEvent: ${JSON.stringify(correspondingDefinedDCAEvent)}`)
        totalPLPercentageNumerator += ((sellEvent.sellQuantity) * (sellEvent.aggregatePrice - correspondingDefinedDCAEvent.aggregatePrice))
        totalPLPercentageDenominator += (sellEvent.sellQuantity * correspondingDefinedDCAEvent.aggregatePrice)
      }
      this.logger.log(`totalPLPercentageNumerator: ${totalPLPercentageNumerator}`);
      this.logger.log(`totalPLPercentageDenominator: ${totalPLPercentageDenominator}`);
      if(totalPLPercentageDenominator !== 0){
        calculatedRealisedProfitLossPercentage = totalPLPercentageNumerator / totalPLPercentageDenominator
      }
    }
    this.logger.log(`calculatedRealisedProfitLossPercentage: ${calculatedRealisedProfitLossPercentage}`)

    // 4. Update the target coin in Portfolio table using coinId with the newly calculated values
    await Portfolio.query()
      .findById(coinId)
      .patch({
        currentAmountOwned: calculatedCurrentAmountOwned,
        currentDollarCostAverage: calculatedCurrentDollarCostAverage,
        dollarSoldAverage: calculatedDollarSoldAverage,
        totalBought: totalBuyQuantity,
        totalSold: totalSellQuantity,
        realisedProfitLossPercentage: calculatedRealisedProfitLossPercentage,
        updatedAt: new Date()
      });
  }
  
}