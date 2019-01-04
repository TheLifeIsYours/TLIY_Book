const fs = require('fs');
const path = require('path');

module.exports = class TLIY_Book {
    constructor(){
        //setup dictionary from all scans, to be used for sentence making
        console.log(`\nSetting collected dictionary`);
        this.collectedDictionariesPath = './data/dictionaries/collectedDictionaries.json';
        this.collectedDictionary = this.readDictionary(this.collectedDictionariesPath);
        
        //setup dictionary from last scan, if no scan takes place
        console.log(`\nSetting latest dictionary`);
        this.latesDictionaryPath = './data/dictionaries/latestDictionary.json';
        this.latestDictionary = this.readDictionary(this.latesDictionaryPath);

        this.currentDictionaryPath = null;
        this.currentDictionary = null;
    }

    setCurrentDictionary(dictionaryPath) {
        console.log(`\nSetting current dictionary`);
        this.currentDictionaryPath = dictionaryPath;
        this.currentDictionary = this.readDictionary(dictionaryPath);
    }

    readDictionary(dictionaryPath){
        console.log(`Reading dictionary from ${dictionaryPath}`);
        if(!fs.existsSync(dictionaryPath)){
            fs.writeFileSync(dictionaryPath, "{}");
        }
        return JSON.parse(fs.readFileSync(dictionaryPath, {encoding: 'utf8'}));
    }
    
    writeDictionary(dictionary, dictionaryPath){
        console.log(`Writing dictionary to ${dictionaryPath}`);
        fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary));
    }

    searchDictionary(dictionary, word){
        return dictionary[word] != undefined ? {found: true, entry: dictionary[word]} : {found: false};
    }

    updateCollectedDictionary(dictionary) {
        Object.keys(dictionary).forEach((entry) => {
            Object.keys(this.collectedDictionary).forEach((collectedEntry) => {
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

        this.writeDictionary(this.collectedDictionary, this.collectedDictionariesPath);
    }

    scanText(textPath){
        let dictionaryPath = `./data/dictionaries/${path.basename(textPath).replace(/\.\w+$/gm, ".json")}`;
        if(fs.existsSync(dictionaryPath)){
            return console.log(`\n${path.basename(dictionaryPath)} has already been scanned.`);
        }

        this.setCurrentDictionary(dictionaryPath);

        let text = fs.readFileSync(textPath, {encoding: 'utf8'});
        let refined = text.toLocaleLowerCase().match(/[\wæøå'-]+/gm);
        
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
                    if(refined[index+1] != undefined){
                        this.currentDictionary[word].associates.push({_this: refined[index+1], score: 1});
                        //console.log(`added new associate: "${refined[index+1]}" to word "${word}"`);
                    }
                }
            } else if (wordInfo.found == false) {
                let entry = {"_this": word, "associates": []};
                
                if(refined[index+1] != undefined){
                    entry.associates.push({"_this": refined[index+1], "score": 1});
                }

                //console.log(`added new word "${word}" to dictionary`);
                this.currentDictionary[word] = entry;
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

    getDictionaryPath(dictionary) {
        dictionary = `./data/dictionaries/${dictionary}.json`;

        if(dictionary == "latest" || !fs.existsSync(dictionary) || dictionary == undefined) {
            dictionary = this.latesDictionaryPath;
        }
        
        if(dictionary == "collected") {
            dictionary = this.collectedDictionariesPath;
        }

        return dictionary;
    }

    getStartWord(startWord){
        if(startWord == undefined || this.currentDictionary[startWord] == undefined){
            console.log(`Could not find start word: "${startWord}"`);
            startWord = this.getRandomObjectValue(this.currentDictionary)._this;
            console.log(`Picking random start word: "${startWord}"`);
        }

        console.log(`\nFound start word: ${startWord}`);
        return startWord;
    }

    makeSentence(options){
        let {words, startWord, sorted, min, max, pick, cooldown, dictionary} = options;
        let res = "";
        let frozenWords = [];

        this.setCurrentDictionary(this.getDictionaryPath(dictionary));

        words = words != undefined ? words : 10;

        if(sorted == undefined || sorted != "random" && sorted != "heighest" && sorted != "lowest" && sorted != "between"){
            options.sorted = "random";
        }
        console.log("\nSorting method: ", options.sorted);

        startWord = this.getStartWord(startWord);
        cooldown = cooldown != undefined ? cooldown : 1;

        let currWord = this.currentDictionary[startWord];
        res = `${currWord._this} `;

        for(let i = 0; i < words; i++){
            let newWord = null;
            //console.log(currWord);

            newWord = this.pickNewAsssociatedWord(currWord, options);

            if(cooldown >= 1){
                if(frozenWords.length >= cooldown){
                    frozenWords.slice(0, 1);
                }

                let wordIsFrozen = false;
                for(let frozenWord of frozenWords){
                    if(newWord == frozenWord){
                        wordIsFrozen = true;
                    }
                }

                if(!wordIsFrozen){
                    //console.log("word is frozen", wordIsFrozen);
                    frozenWords.push(newWord);
                } else {
                    //console.log("word is frozen", wordIsFrozen);
                    newWord = this.pickRandomAssociatedWord(currWord);
                }
            }


            currWord = this.currentDictionary[newWord];
            res += `${newWord} `;
        }

        console.log(`\nStory: ${res}`);
        return res;
    }

    pickNewAsssociatedWord(currWord, options){
        let {words, startWord, sorted, min, max, pick, cooldown, dictionary} = options;
        
        if(sorted == "random") return this.pickRandomAssociatedWord(currWord);
        if(sorted == "heighest") return this.pickHighestAssociatedWord(currWord);
        if(sorted == "lowest") return this.pickLowestAssociatedWord(currWord);
        if(sorted == "between") return this.pickBeetweenassociatedWord(currWord, min, max, pick);
    }

    pickRandomAssociatedWord(word){
        if(word != undefined){
            if(word.associates.length >= 1){
                return this.getRandomObjectValue(word.associates)._this;
            }
        }

        return this.getRandomObjectValue(this.currentDictionary)._this;
    }

    pickHighestAssociatedWord(word){
        let score = 0;
        let res;

        for(let associate of word.associates){
            if(associate.score >= score){
                score = associate.score;
                res = associate._this;
            }
        }

        //console.log("Highest Score", res);
        return res;
    }

    pickLowestAssociatedWord(word){
        let score = Infinity;
        let res;
        //console.log(word);
        for(let associate of word.associates){
            if(associate.score <= score){
                score = associate.score;
                res = associate._this;
            }
        }

        return res;
    }

    pickBeetweenassociatedWord(word, min, max, pick){
        min = min != undefined ? min : 0;
        max = max != undefined ? max : Infinity;
        pick = pick != undefined ? pick : 0.5;

        let posibilities = [];

        for(let associate of word.associates){
            if(associate.score <= max && associate.score >= min){
                posibilities.push(associate);
            }
        }

        if(posibilities.length <= 0) return this.pickRandomAssociatedWord();

        //console.log("Posibilities: ", posibilities);
        
        let sumScore = 0;
        for(let posibility of posibilities){
            sumScore += posibility.score;
        }

        return posibilities[this.constrain(Math.round(sumScore*pick), 0, posibilities.length-1)]._this;
    }

    constrain(num, min, max){
        return num > max ? max : num < min ? min : num;
    }

    getRandomObjectValue(object){
        return object[Object.keys(object)[Math.floor(Math.random() * Object.keys(object).length)]];
    }
}