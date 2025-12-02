<br>
Setup : [Youtube](https://youtube.com/playlist?list=PL54V-i7zW55d1VKxEkp9DCPt5k_zE6m3X)

credit : `https://github.com/shamil-t`

🆁🅴🆀🆄🅸🆁🅴🅼🅴🅽🆃🆂

1.Install nodeJs

- [Node JS](https://nodejs.org/en/download/)

  2.Install Ganache

- [Ganache Truffle](https://www.trufflesuite.com/ganache)

3. Download IPFS (kubo)

- [IPFS Kubo](https://dist.ipfs.tech/#go-ipfs)

  - configure ipfs refer: https://github.com/shamil-t/ehr-blockchain/issues/15#issuecomment-1333342345

  - run the .exe file

4. Add Metamask Extension in Browser

- [Metamask Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en-US)

5. open cmd in project directory

```
npm install --force
```

- open cmd/terminal as Administrator and type

```
npm install -g truffle
```

6.open Ganache

- New Workspace
- AddProject
- Select truffle-config.js in Project Directory
- Save Workspace

7. Compile and migrate Contracts

- In directory cmd:

```
truffle mirgrate
```

```
truffle deploy
```

8. Run Server

```
npm start
```

9. Connect banache to metamask:

- ![New network metamask](/src/assets/images/New_network.png)

- Import account from Ganache to metamask: use private key from ganache, Metamask: press on account on top right -> add wallet -> import an account. Maybe the first one after connect is the admin (don't remember)
  ![Private key](/src/assets/images/ganache.png)
  ![Metamask](/src/assets/images/Import_account.png)

10. Use the app

- Now we have the admin, we'll need to import more accounts/wallets from ganache
- In admin, add the station using public keys of the imported accounts
- To change account simply change the metamaske account(or wallet)

Known Issue: (https://github.com/shamil-t/ehr-blockchain/issues/15)
