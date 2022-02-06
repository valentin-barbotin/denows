import { IUser } from "./interfaces/User.ts";



class User {

    private _id: string;

    private _name: string;

    constructor(id: string, name: string) {
        this._id = id;
        this._name = name;
    }
    
    public stringify() {
        return JSON.stringify(this);
    }

    static fromObject(user: IUser): User | null {
        if (!user._id) return null;
        if (!user._name) return null;

        return new User(user._id ?? '', user._name ?? '');
    }

    public get id() {
        return this._id;
    }

    public set id(id: string) {
        this._id = id;
    }

    public get name() {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
    }
}

export default User;
