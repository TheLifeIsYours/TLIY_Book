const fs = require('fs');
const path = require('path');

module.exports = class TLIY_Book {
    constructor(){
        //setup dictionary from all scans, to be used for sentence making
        this.collectedDictionariesPath = './data/dictionaries/collectedDictionaries.json';
        this.collectedDictionary = this.readDictionary(this.collectedDictionariesPath);
        
        //setup dictionary from last scan, if no scan takes place
        this.latesDictionaryPath = './data/dictionaries/latestDictionary.json';
        this.latestDictionary = this.readDictionary(this.latesDictionaryPath);

        this.currentDictionaryPath;
        this.currentDictionary;
    }

    setCurrentDictionary(dictionaryPath) {
        this.currentDictionaryPath = dictionaryPath;
        this.currentDictionary = this.readDictionary(dictionaryPath);
    }

    readDictionary(dictionaryPath){
        if(!fs.existsSync(dictionaryPath)){
            fs.writeFileSync(dictionaryPath, "{}");
        }
        return JSON.parse(fs.readFileSync(dictionaryPath));
    }
    
    writeDictionary(dictionary, dictionaryPath){
        fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary));
    }

    searchDictionary(dictionary, word){
        return dictionary[word] != undefined ? {found: true, entry: dictionary[word]} : {found: false};
    }

    updateCollectedDictionary(dictionary) {
        dictionary.forEach((entry) => {
            this.collectedDictionary.forEach((collectedEntry) => {
                let wordInfo = this.searchDictionary(this.collectedDictionary, entry._this);
                
                if(wordInfo.found){
                    entry.associates.forEach((associate) => {
                        let associateExist = false;
                        collectedEntry.associates.forEach((collectedAssociate) => {
                            if(associate == collectedAssociate){
                                associateExist = true;
                                collectedAssociate.score++;
                            }
                        });

                        if(!associateExist){
                            collectedEntry.associates.push({_this: refined[index+1], score: 1});
                        }
                    })
                } else if (wordInfo.found == false) {
                    this.currentDictionary[word] = {"_this": word, "associates": [{"_this": refined[index+1], "score": 1}]};
                    //console.log(`added new word "${word}" to dictionary`);
                }
            });
        });
    }

    scanText(textPath){
        this.setCurrentDictionary(`./data/dictionaries/${path.basename(textPath).replace(/\.\w+$/gm, ".json")}`);

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
            let wordInfo = this.searchDictionary(this.currentDictionary, word);

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
                    this.currentDictionary[word].associates.push({_this: refined[index+1], score: 1});
                    //console.log(`added new associate: "${refined[index+1]}" to word "${word}"`);
                }
            } else if (wordInfo.found == false) {
                this.currentDictionary[word] = {"_this": word, "associates": [{"_this": refined[index+1], "score": 1}]};
                //console.log(`added new word "${word}" to dictionary`);
            }
            
            console.log(`Scanning text to dictionary ${path.basename(this.currentDictionaryPath)}`);
            this.writeDictionary(this.currentDictionary, this.currentDictionaryPath);
            
            if(averageTime.length >= 256){
                averageTime.splice(0, 1);
            }

            averageTime.push(new Date(new Date() - currentTime).getTime());
            estimateTime = new Date((averageTime.reduce((i,j) => i+j) / averageTime.length) * refined.length-index);

            
            newCountDownTime = new Date((estimateTime.getTime() + startTime.getTime()) - new Date().getTime());
            countDownTime = newCountDownTime.getTime() <= countDownTime.getTime() ? newCountDownTime : countDownTime;

            console.log(`Processing progress: ${Number(Math.ceil(Number(index * 100/refined.length)+"e2")+"e-2")}% \nTime remaining ${countDownTime.getHours()-1}:${countDownTime.getMinutes()}:${countDownTime.getSeconds()}`);
        });

        this.writeDictionary(this.currentDictionary, this.latesDictionaryPath);
        this.updateCollectedDictionary(this.currentDictionary);
    }

    makeSentence(words, startWord, highestScore){
        this.setCurrentDictionary(this.latesDictionaryPath);

        let res = "";
        startWord = this.currentDictionary[startWord] != undefined ? this.currentDictionary[startWord]._this : false;
        highestScore = highestScore != undefined ? true : false;

        if(!startWord){
            console.error("Could not find start word in dictionary", "Picking a random start word");
            startWord = this.getRandomObjectValue(this.currentDictionary)._this;
        }

        console.log(startWord);

        res += startWord;

        let currWord = startWord;
        for(let i = 0; i < words; i++){
            let wordAssosiacets = this.currentDictionary[currWord].associates;

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