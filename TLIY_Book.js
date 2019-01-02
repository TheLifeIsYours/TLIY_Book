const fs = require('fs');
const path = require('path');

module.exports = class TLIY_Book {
    constructor(){
        this.dictionaryPath = './data/dictionaries/lastDictionary.json';
        this.dictionary;

        //setup dictionary from last scan, if no scan takes place
        this.readDictionary();
    }

    readDictionary(){
        this.dictionary = JSON.parse(fs.readFileSync(this.dictionaryPath));
    }
    
    writeDictionary(){
        fs.writeFileSync(this.dictionaryPath, JSON.stringify(this.dictionary));
    }

    updateLastDictionary(){
        fs.writeFileSync('./data/dictionaries/lastDictionary.json', JSON.stringify(this.dictionary));
    }

    setDictionaryPath(path) {
        this.dictionaryPath = path;
    }
    
    makeDictionaryFile() {
        if(!fs.existsSync(this.dictionaryPath)){
            fs.writeFileSync(this.dictionaryPath, "{}");
        }
    }

    scanText(textPath){
        this.setDictionaryPath(`./data/dictionaries/${path.basename(textPath).replace(/\.\w+$/gm, ".json")}`);
        this.makeDictionaryFile();
        this.readDictionary();

        let text = fs.readFileSync(textPath, 'utf8');
        let refined = text.toLocaleLowerCase().match(/[\w'-]+/gm);
        
        let startTime = new Date();
        let currentTime = startTime;
        let estimateTime = startTime;
        let countDownTime = startTime;
        let newCountDownTime = startTime;
        let averageTime = [];

        refined.forEach((word, index)=> {
            currentTime = new Date();
            console.log(`\n\n\n\n\n`);
            //console.log(Searching for word "${word}"`);
            let wordInfo = this.searchDictionary(word);

            if(wordInfo.found){
                //console.log(`found word entry "${wordInfo.entry._this}" \nwith ${wordInfo.entry.associates != undefined ? wordInfo.entry.associates.length : 0} associates`);
                let associateExist = false;
                wordInfo.entry.associates.forEach((associate) => {
                    if(associate._this == refined[index+1]){
                        associateExist = true;
                        associate.score++;
                    }
                })

                if(!associateExist){
                    this.dictionary[word].associates.push({_this: refined[index+1], score: 1});
                    //console.log(`added new associate: "${refined[index+1]}" to word "${word}"`);
                }
            } else if (wordInfo.found == false) {
                this.dictionary[word] = {"_this": word, "associates": [{"_this": refined[index+1], "score": 1}]};
                //console.log(`added new word "${word}" to dictionary`);
            }
            
            console.log(`Scanning text to dictionary ${path.basename(this.dictionaryPath)}`);
            this.writeDictionary();
            
            if(averageTime.length >= 256){
                averageTime.splice(0, 1);
            }

            averageTime.push(new Date(new Date() - currentTime).getTime());
            estimateTime = new Date((averageTime.reduce((i,j) => i+j) / averageTime.length) * refined.length-index);

            
            newCountDownTime = new Date((estimateTime.getTime() + startTime.getTime()) - new Date().getTime());
            countDownTime = newCountDownTime.getTime() <= countDownTime.getTime() ? newCountDownTime : countDownTime;

            console.log(`Processing progress: ${Number(Math.round(Number(index * 100/refined.length)+"e2")+"e-2")}% \nTime remaining ${countDownTime.getHours()-1}:${countDownTime.getMinutes()}:${countDownTime.getSeconds()}`);
        });

        this.updateLastDictionary();
    }

    searchDictionary(word){
        return this.dictionary[word] != undefined ? {found: true, entry: this.dictionary[word]} : {found: false};
    }

    makeSentence(words, startWord, highestScore){
        let res = "";
        startWord = this.dictionary[startWord] != undefined ? this.dictionary[startWord]._this : false;
        highestScore = highestScore != undefined ? true : false;

        if(!startWord){
            console.error("Could not find start word in dictionary", "Picking a random start word");
            startWord = this.getRandomObjectValue(this.dictionary)._this;
        }

        console.log(startWord);

        res += startWord;

        let currWord = startWord;
        for(let i = 0; i < words; i++){
            let wordAssosiacets = this.dictionary[currWord].associates;

            if(highestScore){
                let highestScoring = 0;
                wordAssosiacets.forEach((associate) => {
                    if(associate.score > highestScoring){
                        currWord = associate._this;
                    }
                });
            } else {
                currWord = this.getRandomObjectValue(wordAssosiacets)._this;
            }
            res += ` ${currWord}`;
        }
        console.log(res);
        return res;
    }

    getRandomObjectValue(object){
        return object[Object.keys(object)[Math.floor(Math.random() * Object.keys(object).length)]];
    }
}