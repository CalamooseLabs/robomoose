export function numberToWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  function processGroup(n: number): string {
    if (n === 0) return "";

    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;

    let result = "";

    if (hundred > 0) {
      result += ones[hundred] + " Hundred ";
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        result += tens[ten];
        if (one > 0) {
          result += "-" + ones[one];
        }
      }
    }

    return result.trim();
  }

  if (num === 0) return "Zero and No/100";

  const parts = num.toString().split(".");
  let wholePart = Math.abs(parseInt(parts[0]));
  const decimalPart = parts[1] ? parseInt(parts[1]) : 0;

  let result = num < 0 ? "Negative " : "";
  const groups: number[] = [];

  while (wholePart > 0) {
    groups.push(wholePart % 1000);
    wholePart = Math.floor(wholePart / 1000);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] !== 0) {
      const groupText = processGroup(groups[i]);
      if (groupText) {
        result += groupText + " " + scales[i] + " ";
      }
    }
  }

  result = result.trim() + " and ";

  if (decimalPart > 0) {
    const decimalStr = decimalPart.toString().padEnd(2, "0").slice(0, 2);
    result += decimalStr + "/100";
  } else {
    result += "No/100";
  }

  return result.trim();
}

// To run from command line with arguments
if (import.meta.main) {
  const input = Deno.args[0];
  if (input) {
    const num = parseFloat(input);
    if (!isNaN(num)) {
      console.log(numberToWords(num));
    } else {
      console.error("Please provide a valid number");
    }
  } else {
    console.error("Please provide a number as an argument");
  }
}
