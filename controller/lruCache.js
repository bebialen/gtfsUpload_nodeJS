

console.log('Priority Queue Controller Loaded');

class ListNode{

    value;
    prev;
    next;

    constructor(value){
        this.value = value;
        this.prev = null;
        this.next = null;

    }
}


class LruCache{

    constructor(capacity){

        this.capacity = capacity;
        this.map = new Map();
    }


    get(key){

        if(!this.map.has(key)) return false;

        const node = this.map.get(key);

    }




}