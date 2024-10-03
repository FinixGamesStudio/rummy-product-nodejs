

function calculateDeductions(cash:number, bonus:number, winCash:number) {
    const totalAvailable = cash + bonus + winCash;
  
    if (totalAvailable === 0) {
      return { cash: 0 }; // No funds available
    }
  
    const cashPercentage = cash / totalAvailable;
    const bonusPercentage = bonus / totalAvailable;
    const winCashPercentage = winCash / totalAvailable;
  
    let cashDeduction = 0;
    let bonusDeduction = 0;
    let winCashDeduction = 0;
    let Seventy_Five_Percent = 0.75;
    let Fifty_Percent = 0.50;
    let Twenty_Five_Percent = 0.25;
  
    if (bonus > 0 && winCash > 0) {
      // Deduct 50% from cash, 25% from bonus, and 25% from win cash
      cashDeduction = 0.5 * cashPercentage;
      bonusDeduction = 0.25 * bonusPercentage;
      winCashDeduction = 0.25 * winCashPercentage;
    } else if (bonus === 0 && winCash > 0) {
      // Deduct 75% from cash and 25% from win cash
      cashDeduction = 0.75 * cashPercentage;
      winCashDeduction = 0.25 * winCashPercentage;
    } else if (bonus > 0 && winCash === 0) {
      // Deduct 75% from cash and 25% from bonus
      cashDeduction = 0.75 * cashPercentage;
      bonusDeduction = 0.25 * bonusPercentage;
    } else {
      // Deduct 100% from cash
      cashDeduction = cashPercentage;
    }
  
    return {
      cash: cash - (cashDeduction * cash),
      bonus: bonus - (bonusDeduction * bonus),
      winCash: winCash - (winCashDeduction * winCash),
    };
  }
  
  // Example usage
  const cashAmount = 500;
  const bonusAmount = 200;
  const winCashAmount = 300;
  
  const result = calculateDeductions(cashAmount, bonusAmount, winCashAmount);
  console.log(result);
  