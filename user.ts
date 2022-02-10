import { IUser } from "./interfaces/User.ts";



class User {

    private _id: string;

    private _name: string;

    private _model: string;

    constructor(id: string, user: IUser) {
        console.warn(user);
        this._id = id;
        this._name = user._name?.trim() ?? 'null';
        this._model = user._model ?? 'default';
    }
    
    public stringify() {
        return JSON.stringify(this);
    }

    static fromObject(user: IUser): User | null {
        if (!user._id || !user._name || !user.model) return null;

        return new User(user._id, user);
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

    public get model() {
        return this._model;
    }

    public set model(model: string) {
        this._model = model;
    }
}

export default User;
