
import * as chaiModule from 'chai';
// import chaiSpies from 'chai-spies';
import chaiPromised from 'chai-as-promised';

const chai = chaiModule.use(chaiPromised);

export default chai;
export const { expect } = chai;
