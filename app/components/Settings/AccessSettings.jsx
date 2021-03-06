import React from "react";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import {settingsAPIs} from "../../api/apiConfig";
import willTransitionTo from "../../routerTransition";
import {withRouter} from "react-router/es";
import {connect} from "alt-react";
import cnames from "classnames";
import Icon from "../Icon/Icon";

const autoSelectAPI = "wss://fake.automatic-selection.com";
const testnetAPI = settingsAPIs.WS_NODE_LIST.find(
    a => a.url.indexOf("node.testnet.bitshares.eu") !== -1
);
const testnetAPI2 = settingsAPIs.WS_NODE_LIST.find(
    a => a.url.indexOf("testnet.nodes.bitshares.ws") !== -1
);

class ApiNode extends React.Component {
    constructor(props) {
        super(props);
    }

    activate(url) {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: url
        });
        setTimeout(
            function() {
                willTransitionTo(
                    this.props.router,
                    this.props.router.replace,
                    () => {},
                    false
                );
            }.bind(this),
            50
        );
    }

    remove(url, name, e) {
        this.props.triggerModal(e, url, name);
    }

    show(url) {
        SettingsActions.showWS(url);
    }

    hide(url) {
        SettingsActions.hideWS(url);
    }

    render() {
        const {props, state} = this;
        const {
            allowActivation,
            allowRemoval,
            automatic,
            autoActive,
            name,
            url,
            displayUrl,
            ping,
            up,
            hidden,
            activeNode,
            popup
        } = props;

        let color;
        let latencyKey;
        let friendlyPing;

        if (ping < 400) {
            color = "low";
            latencyKey = "low_latency";
        } else if (ping >= 400 && ping < 800) {
            color = "medium";
            latencyKey = "medium_latency";
        } else {
            color = "high";
            latencyKey = "high_latency";
        }

        friendlyPing = ping >= 1000 ? +(ping / 1000).toFixed(2) + "s" : ping + "ms";

        //console.log("Active: " + activeNode.url + " Current: " + currentNode);

        /*
        * The testnet latency is not checked in the connection manager,
        * so we force enable activation of it even though it shows as 'down'
        */
        const isTestnet = url === testnetAPI.url || url === testnetAPI2.url;

        let totalNodes = settingsAPIs.WS_NODE_LIST.length - 3;

        if(popup) {
            return url === autoSelectAPI ? 
                <div>
                    <span 
                        className="switch"
                        style={{float: "right", position: "relative", top: "-15px"}}
                        onClick={this.activate.bind(this, autoActive ? activeNode.url : autoSelectAPI)}
                    >
                        <input type="checkbox" checked={autoActive}  />
                        <label />
                    </span>
                    <p style={{fontSize: "80%"}}>Automatic Switching {autoActive ? "on" : "off"}</p>
                </div>
                :
                <div className="api-status">
                    <a>
                        <Icon className={color} name={activeNode.url == url ? "link" : "shuffle"} size="1_5x" onClick={this.activate.bind(this, url)} />
                    </a>
                    {name}
                </div>
            ;
        } else {
            return url === autoSelectAPI ?
                <div className="auto-node">
                    <div>
                        <span 
                            className="switch"
                            onClick={this.activate.bind(this, autoActive ? activeNode.url : autoSelectAPI)}
                        >
                            <input type="checkbox" checked={autoActive} />
                            <label />
                        </span>
                        <Translate component="div" style={{paddingLeft: "1rem", paddingTop: "0.5rem"}} content="settings.automatic" totalNodes={totalNodes} />
                        {/* 
                        // FOR FUTURE PING NODES FEATURE
                        <div
                            className="button"
                            style={{position: "absolute", right: 0}}
                            onClick={}
                        >
                            <Translate
                                id="ping"
                                component="span"
                                content="settings.ping"
                            />
                        </div> */}
                    </div>
                </div>
                :
                <div className="api-node">
                    <div>
                        <p>{name}</p>
                        <p>{displayUrl}</p>
                    </div>
                    <div>
                        {isTestnet && !ping ? null : 
                            <div className="api-status">
                                {!up ? 
                                    <span className="high"><Translate content="settings.node_down" /></span>
                                    : 
                                    <span className={color}>
                                        <Translate content={`settings.${latencyKey}`} /><p>{friendlyPing}</p>
                                    </span>
                                }
                            </div>
                        }
                    </div>
                    <div>
                        {allowRemoval ? // USER NODES CAN'T BE HIDDEN
                            <a onClick={this.remove.bind(this, url, name)}>
                                <Translate id="remove" component="p" content="settings.remove"/>
                            </a>
                            : 
                            !automatic && hidden ? 
                                <a onClick={this.show.bind(this, url)}>
                                    <Translate component="p" content="settings.show" />
                                </a>
                                : 
                                <a onClick={this.hide.bind(this, url)}>
                                    <Translate component="p" content="settings.hide" />
                                </a>
                        }
                        {activeNode.url != url ? 
                            <a><Icon name={"shuffle"} size="1_5x" onClick={this.activate.bind(this, url)} /></a>
                            :
                            <Icon name={"link"} size="2x" />
                        }
                    </div>
                </div>
            ;
        }
    }
}

ApiNode.defaultProps = {
    name: "Test node",
    url: "wss://testnode.net/wss",
    displayUrl: "wss://testnode.net/wss",
    up: true,
    ping: null,
    allowActivation: false,
    allowRemoval: false,
    hidden: false
};

const ApiNodeWithRouter = withRouter(ApiNode);

class AccessSettings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "available-nodes"
        };

        let isDefaultNode = {};

        settingsAPIs.WS_NODE_LIST.forEach(node => {
            isDefaultNode[node.url] = true;
        });

        this.isDefaultNode = isDefaultNode;
    }

    getNodeIndexByURL(url) {
        const {nodes} = this.props;

        let index = nodes.findIndex(node => node.url === url);
        if (index === -1) {
            return null;
        }
        return index;
    }

    getCurrentNodeIndex() {
        const {props} = this;
        let currentNode = this.getNodeIndexByURL.call(this, props.currentNode);

        return currentNode;
    }

    getNode(node) {
        const {props} = this;

        return {
            name: node.location || "Unknown location",
            url: node.url,
            up: node.url in props.apiLatencies,
            ping: props.apiLatencies[node.url],
            hidden: !!node.hidden
        };
    }

    renderNode(node, activeNode, allowActivation) {
        const {props} = this;

        let automatic = node.url === autoSelectAPI;

        let displayUrl = automatic ? "..." : node.url;

        let name =
            !!node.name &&
            typeof node.name === "object" &&
            "translate" in node.name ? (
                <Translate component="span" content={node.name.translate} />
            ) : (
                node.name
            );

        let allowRemoval =
            !automatic && !this.isDefaultNode[node.url] ? true : false;

        return (
            <ApiNodeWithRouter
                {...node}
                autoActive={props.currentNode === autoSelectAPI}
                automatic={automatic}
                allowActivation={allowActivation}
                allowRemoval={allowActivation && allowRemoval}
                key={node.url}
                name={name}
                displayUrl={displayUrl}
                triggerModal={props.triggerModal}
                activeNode={activeNode}
                popup={props.popup}
            />
        );
    }

    _changeTab(tab) {
        this.setState({
            activeTab: tab
        });
    }

    render() {
        const {props} = this;
        let getNode = this.getNode.bind(this);
        let renderNode = this.renderNode.bind(this);
        let currentNodeIndex = this.getCurrentNodeIndex.call(this);
        let hc = "nodes-header clickable";
        let showAvailableNodes = this.state.activeTab !== "hidden-nodes";
        let availableClass = cnames(hc, {inactive: this.state.activeTab !== "available-nodes"});
        let hiddenClass = cnames(hc, {inactive: this.state.activeTab !== "hidden-nodes"});
        let myClass = cnames(hc, {inactive: this.state.activeTab !== "my-nodes"});


        let activeNode = getNode(
            props.nodes[currentNodeIndex] || props.nodes[0]
        );

        if (activeNode.url == autoSelectAPI) {
            let nodeUrl = props.activeNode;
            currentNodeIndex = this.getNodeIndexByURL.call(this, nodeUrl);
            activeNode = getNode(props.nodes[currentNodeIndex]);
        }

        let nodes = props.nodes
            .map(node => {
                return getNode(node);
            })
            .filter(node => {
                return node.hidden !== showAvailableNodes && node.url !== activeNode.url;
            });

        nodes = nodes
            .sort(function(a, b) {
                let isTestnet =
                    a.url === testnetAPI.url || a.url === testnetAPI2.url;
                if (a.url == autoSelectAPI) {
                    return -1;
                } else if (a.up && b.up) {
                    return a.ping - b.ping;
                } else if (!a.up && !b.up) {
                    if (isTestnet) return -1;
                    return 1;
                } else if (a.up && !b.up) {
                    return -1;
                } else if (b.up && !a.up) {
                    return 1;
                }

                return 0;
            });

        if(this.state.activeTab === "my-nodes") {
            nodes = nodes.filter(node => {
                return !this.isDefaultNode[node.url];
            });
        } else {
            nodes = nodes.filter(node => {
                return node.hidden !== showAvailableNodes && this.isDefaultNode[node.url];
            });
        }

        let autoNode = getNode(props.nodes[0]);
        let popupCount = 0;
        return this.props.popup 
            ? <div>
                <div style={{fontWeight: "bold", height: 40}}>
                    <Translate content="settings.switch" />
                    {renderNode(autoNode, activeNode, false)}
                </div>
                <div className="nodes-list" style={{display: props.currentNode === autoSelectAPI ? "none" : ""}}>
                    {nodes.map(node => {
                        if(node.url !== autoSelectAPI) {
                            popupCount++;
                            if(popupCount <= 5) { return renderNode(node, activeNode, true); }
                        }
                    })}
                </div>
            </div>
            : <div style={{paddingTop: "1em"}}>
                {renderNode(autoNode, activeNode, false)}
                <div className="active-node">
                    <Translate component="h4" style={{marginLeft: "1rem"}} content="settings.active_node" />
                    {renderNode(activeNode, activeNode, false)}
                </div>
                <div
                    className="nodes"
                    style={{display: props.currentNode === autoSelectAPI ? "none" : "", position: "relative", marginBottom: "2em"}}
                >
                    <div className="grid-block shrink" style={{marginLeft: 0}}>
                        <div
                            className={availableClass}
                            onClick={this._changeTab.bind(
                                this,
                                "available-nodes"
                            )}
                        >
                            <Translate content="settings.available_nodes" />
                        </div>
                        <div
                            className={hiddenClass}
                            onClick={this._changeTab.bind(this, "hidden-nodes")}
                        >
                            <Translate content="settings.hidden_nodes" />
                        </div>
                        <div
                            className={myClass}
                            onClick={this._changeTab.bind(this, "my-nodes")}
                        >
                            <Translate content="settings.my_nodes" />
                        </div>
                    </div>
                    {this.state.activeTab !== "my-nodes" ? null : 
                        <div style={{paddingLeft: "1rem", paddingBottom: "1rem"}}>
                            <div
                                className="button"
                                onClick={props.triggerModal.bind(this)}
                            >
                                <Translate
                                    id="add"
                                    component="span"
                                    content="settings.add_api"
                                />
                            </div>
                        </div>
                    }
                    
                    {nodes.map(node => {
                        if(node.url !== autoSelectAPI)
                            return renderNode(node, activeNode, true);
                    })}
                </div>
            </div>
        ;
    }
}

AccessSettings = connect(AccessSettings, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            currentNode: SettingsStore.getState().settings.get("apiServer"),
            activeNode: SettingsStore.getState().settings.get("activeNode"),
            apiLatencies: SettingsStore.getState().apiLatencies
        };
    }
});

export default AccessSettings;
