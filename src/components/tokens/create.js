import React from 'react';
import { connect } from 'react-redux';
import { Panel, Form, FormGroup, ControlLabel, FormControl, Button,Row, Col } from 'react-bootstrap';
import { generateTokenTransaction, estimateTokenGas, createToken } from '../../store/tokenActions';
import { sendTransaction } from '../../store/transactionActions';
import { gotoTab } from '../../store/tabActions';
import { CreateTxModal } from '../transaction/modals';
import OpenWallet from '../wallet/open';
import { hexToDecimal } from '../../lib/convert';
import { ToolPopup } from '../../elements/tooltip';

const DefaultGas = "0x11a7a7";

class CreateTokenForm extends React.Component {
  constructor(props) {
    super(props);
    this.initToken = this.initToken.bind(this);
    this.estimateGas = this.estimateGas.bind(this);
    this.submitTx = this.submitTx.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changeGas = this.changeGas.bind(this);
    this.state = {
      symbol: 'TOKN',
      decimals: 8,
      modalShow: false,
      showTx: false,
      gas: DefaultGas,
      tx: {},
    };
  }

  getRequiredValidation(key) {
    if (this.state.key) return 'success';
    else return 'warning';
  }

  handleChange(e) {
    this.setState({ [e.target.id]: e.target.value });
  }

  changeGas(e) {
    this.setState({ gas: e.target.value })
  }

  estimateGas() {
    const data = {
      token: this.state.token,
      symbol: this.state.symbol,
      totalSupply: this.state.totalSupply,
      decimals: this.state.decimals,
    }
    this.props.estimateGas(data, this.props.wallet)
      .then((result) => {
        this.setState({ modalShow: true,
                        showTx: false
                      });
        this.setState({ gas: result || DefaultGas});
      })
  }

  initToken() {
    const data = {
      token: this.state.token,
      symbol: this.state.symbol,
      totalSupply: this.state.totalSupply,
      decimals: this.state.decimals,
      gasLimit: this.state.gas,
    }
    this.props.initToken(data, this.props.wallet)
      .then((result) => {
        this.setState({ modalShow: true,
                        showTx: true,
                        tx: result
                      });
      })
  }

  submitTx() {
    this.props.sendTransaction(
        this.state.tx.signedTx,
        this.state,
        this.props.wallet.getAddressString()
        ).then((result) => {
          this.setState({ modalShow: false, showTx: false })
      })
  }

  render() {
    let modalClose = () => this.setState({ modalShow: false });

    return (
      <div>
      <h2>Create a Token</h2>
      <Row>
        <Col sm={6}>
        <Form>
          <FormGroup
            controlId="token"
            validationState={this.getRequiredValidation('token')}
          >
            <ControlLabel>Token Name</ControlLabel>
            <ToolPopup title="Pick a great name for your new token that is easy to remember.">
            <FormControl
              type="text"
              placeholder="TokenMint Coin"
              onChange={this.handleChange}
            />
            </ToolPopup>
              <FormControl.Feedback />
          </FormGroup>
         <FormGroup
            controlId="totalSupply"
            validationState={this.getRequiredValidation('totalSupply')}
          >
            <ControlLabel>Total Supply</ControlLabel>
            <ToolPopup title="This is the total amount of tokens that will ever exist.">
            <FormControl
              type="number"
              placeholder="1000000"
              onChange={this.handleChange}
            />
            </ToolPopup>
            <FormControl.Feedback />

          </FormGroup>

          <FormGroup
            controlId="symbol"
          >
            <ControlLabel>Token Symbol (optional)</ControlLabel>
            <ToolPopup  title="This is the 3-5 letter 'code' that users will use to identify your token on exchanges and in their wallet.">
            <FormControl
              type="text"
              placeholder="TOKN"
              onChange={this.handleChange}
            />
            </ToolPopup>
              <FormControl.Feedback />
          </FormGroup>

          <FormGroup
            controlId="decimals"
          >
            <ControlLabel>Decimal Places (optional)</ControlLabel>
            <ToolPopup title="How many decimal places will the token have?">
            <FormControl
              type="number"
              placeholder="8"
              onChange={this.handleChange}
            />
            </ToolPopup>
            <FormControl.Feedback />
          </FormGroup>

        </Form>
        </Col>
        {/*<Col sm={6}>
        //  <Panel header={"INFO"} bsStyle="success">
        //  -This will contain dynamic steps <br />
        //  - every time you click on a different field to fill out <br />
        //  - They might be related to the field <br />
        //  - or they can be general information <br />
        //  </Panel>
        //</Col>*/}
        </Row>


        <Row>
        <Col sm={12}>
        {this.props.wallet &&
          <Button
            bsStyle="primary"
            onClick={this.estimateGas} >
            MINT A TOKEN
          </Button>}
        {!this.props.wallet &&
          <Panel header="Please unlock your account to continue">
              <OpenWallet />
          </Panel>
        }
        </Col>
        </Row>

        <CreateTxModal
          show={this.state.modalShow}
          close={modalClose}
          showTx={this.state.showTx}
          rawTx={this.state.tx.rawTx}
          signedTx={this.state.tx.signedTx}
          gas={hexToDecimal(this.state.gas || DefaultGas)}
          changeGas={this.changeGas}
          onGenerate={this.initToken}
          submitTx={this.submitTx}
          />
      </div>
    );
  }
};


const CreateToken = connect(
  (state, ownProps) => {
    return {
      wallet: state.wallet.get('wallet')
    }
  },
  (dispatch, ownProps) => ({
    estimateGas: (data, wallet) => {
      return new Promise((resolve, reject) => {
        dispatch(estimateTokenGas( data, wallet ))
        .then((result) => resolve(result));
      })
    },
    initToken: (data, wallet) => {
      return new Promise((resolve, reject) => {
        dispatch(
          generateTokenTransaction( data, wallet )
        ).then((result) => resolve(result))
      })
    },
    sendTransaction: (tx, data, address) => {
      const afterTx = (txhash) => {
        console.log(txhash)
        const token = {
            owner: address,
            initialSupply: data.totalSupply,
            name: data.token,
            decimals: data.decimals,
            symbol: data.symbol,
            tokenTx: txhash,
        };
        dispatch(gotoTab('ico', token));
        dispatch(createToken(token));
      };

      const resolver = (resolve, f) => (x) => {
        f.apply(x);
        resolve(x);
      };

      return new Promise((resolve, reject) => {
        dispatch(sendTransaction( tx ))
          .then(resolver(afterTx, resolve));
      });
    }
  })
)(CreateTokenForm)

export default CreateToken;
