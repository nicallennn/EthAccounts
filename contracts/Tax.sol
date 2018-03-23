pragma solidity ^0.4.18;

contract Tax {

    //tax users data type
    struct TaxPayments {
      uint256 taxPaymentId;
      address admin;
      address taxAddress;
      string taxPeriod;
      string date;
      uint256 total;
    }

    //mapping for tax users
    mapping(uint => TaxPayments) public taxMadePayments;
    uint taxPaymentCount;

    //modifier

    //events
    event LogPayTax(
      uint256 indexed _taxPaymentId,
      address indexed _admin,
      address indexed taxAddress,
      string _taxPeriod,
      string _date,
      uint256 total
      );


    //pay tax
    function payTax(address _taxAddress, string _taxPeriod, string _date, uint256 _total) payable public {

      //pay tax
      _taxAddress.transfer(msg.value);

      //increment taxPayments
      taxPaymentCount++;

      //add to tax payments
      taxMadePayments[taxPaymentCount] = TaxPayments (
        taxPaymentCount,
        msg.sender,
        _taxAddress,
        _taxPeriod,
        _date,
        _total
        );

        //log the payment
        LogPayTax(taxPaymentCount, msg.sender, _taxAddress, _taxPeriod, _date, _total);

    }

    //get tax payments
    function getTaxPayments() public view returns(uint[]) {
      //array to store initial sort results
      uint[] memory taxPaymentIds = new uint[](taxPaymentCount);

      uint256 paymentNo;

      //sort payments
      for(uint i = 1; i <= taxPaymentCount; i++){
        if(taxMadePayments[i].admin == msg.sender){
          taxPaymentIds[paymentNo] = taxMadePayments[i].taxPaymentId;

          paymentNo++;
        }

      }

      //array to store sorted ids
      uint[] memory sortedIds = new uint[](paymentNo);

      //sort to correct sized array
      for(uint j = 0; j < paymentNo; j++){
        sortedIds[j] = taxPaymentIds[j];
      }
      //return sorted payments array
      return sortedIds;
    }


    //get total tax paid
    function getTotalPaidTax()public view returns(uint256) {
      //array to store initial sort results
      uint256 totalPaidTax;

      //sort payments
      for(uint i = 1; i <= taxPaymentCount; i++){
        if(taxMadePayments[i].admin == msg.sender){
          totalPaidTax += taxMadePayments[i].total;

        }
      }

      //return the total tax paid
      return totalPaidTax;
    }

    
}
