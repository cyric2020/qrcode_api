class HashMap {
  constructor(seperator) {
    if(!seperator){
      this.seperator = "~£¬!@!¬£~";
    }else{
      this.seperator = seperator;
    }
  }
}

module.exports = HashMap;

exports.seperator = () => {
  return(this.seperator);
}
