import React, { Component } from 'react';
import RandomColor from 'randomcolor';
import {Segment} from 'semantic-ui-react'
//import uuidv1 from 'uuid/v1';

import PostIt from "../../Components/CanvasEditor/PostIt";
import LinkIt from "../../Components/CanvasEditor/LinkIt";
import TargIt from "../../Components/CanvasEditor/TargIt";
import {createTextEntry, createReferencePair} from "../../common/model/entry";
import Dashboard from '../../libs/react-dazzle-custom/lib/components/Dashboard';
import {Helper} from "../../Components/Helper"

import './style.css';

/**
 * @class BuildBlock : react component - a semantic BuildingBlock shown in a canvas
 * a BuildBlock can have different types : plain/target/link
 *  -> specifies the type and behavior of the child entries
 */
class BuildBlock extends Component{

  /**
   * specifies the default propTypes
   */
  static propTypes = {

  };

  /**
   * constructor
   * @param {*} props all handed props
   */
  constructor(props) {
    super(props);
    this.buildStructure = this.buildStructure.bind(this);
    this.entryReps={};
    this.printListener = this.printListener.bind(this)
    this.state = {...this.state||{},printing:false}
  }

  printListener(evt){
    this.setState({...this.state||{}, printing: evt.matches});
  }

  componentDidMount(){
    this.setState({...this.state||{}, printing: false});
    window.matchMedia("print").addListener(this.printListener);
  }

  componentWillUnmount(){
    window.matchMedia("print").removeListener(this.printListener);
  }

  /**
   * generates the displayed layout structure for react-dazzle based on its context
   */
    buildStructure(){
      /*
        first, check if block is locked by actions from other users
        then, apply the editability of the whole canvas with logical and (maybe you are in
        history mode or have no rights to do something)
      */
      let editable = true;
      if(this.props.lockings !== undefined && this.props.lockings.indexOf(this.props.block._id) > -1){
        editable = false;
      }
      editable = editable && this.props.editable;

      /*
        by react-dazzle required structure
        see npm react-dazzle for more information
      */
      let structure = {
              widgets: {
                PostIt: {
                  type: PostIt,
                  title: 'Entry'
                },
                LinkIt: {
                  type: LinkIt,
                  title: 'Entry'
                },
                TargIt: {
                  type: TargIt,
                  title: 'Entry'
                }
              },
              layout: {
                  rows: [{
                    columns: [{
                      className: 'col-md-12 col-sm-12 col-xs-12',
                      widgets: [],
                    }]
                  }]
                }
          };

          /*
            create different entries depending on the type of the BuildBlock
          */
          switch(this.props.block.buildingBlockType){
          //only text data
          case 'data':
              Object.values(this.props.block.entries).forEach((entry,index) => {
                structure.layout.rows[0].columns[0].widgets.push({key: 'PostIt', title: entry.content.title ,text: entry.content.text,
                    entyID: entry._id, blockID: this.props.block._id, canvasID:this.props.canvasid, 
                    model: entry, callback: this.onChangeEntry.bind(this), onKeyDown: this.onKeyDown.bind(this), editable: editable,
                    openSettings : this.props.openSettings,
                    globalTags:this.props.globalTags,
                    enableMarkdown:this.props.enableMarkdown,
                    ref: (entryRep)=>{
                      if(entryRep){
                      this.entryReps[entry._id]=entryRep;
                    }else{
                      delete this.entryReps[entry._id];
                    }}});
              });
              break;
            //text data with a ref link
            case 'link':
              Object.values(this.props.block.entries).forEach((entry,index) => {
                structure.layout.rows[0].columns[0].widgets.push({key: 'LinkIt', title: entry.content.title ,text: entry.content.text,
                    entyID: entry._id, blockID: this.props.block._id, canvasID:this.props.canvasid, 
                    project_id: this.props.project_id, mode: this.props.mode, tagID: this.props.tagID, model: entry,
                    editable: editable, callback: this.onChangeEntry.bind(this),
                    onKeyDown: this.onKeyDown.bind(this),
                    onReferenceCall: this.onReferenceCall.bind(this),
                    color : RandomColor({seed: 3*index}),
                    openSettings : this.props.openSettings,
                    globalTags:this.props.globalTags,
                    enableMarkdown:this.props.enableMarkdown,
                    ref: (entryRep)=>{
                      if(entryRep){
                      this.entryReps[entry._id]=entryRep;
                    }else{
                      delete this.entryReps[entry._id];
                    }}});
              });
              break;
            //target of an entry with type link
            case 'target':
              Object.values(this.props.block.entries).forEach((entry,index) => {
                structure.layout.rows[0].columns[0].widgets.push({key: 'TargIt', editable: editable, title: entry.content.title ,text: entry.content.text,
                    entyID: entry._id, blockID: this.props.block._id, canvasID:this.props.canvasid, 
                    model: entry, callback: this.onChangeEntry.bind(this), onKeyDown: this.onKeyDown.bind(this),
                    color : RandomColor({seed: 3*index}),
                    openSettings : this.props.openSettings,
                    globalTags:this.props.globalTags,
                    enableMarkdown:this.props.enableMarkdown,
                    ref: (entryRep)=>{
                      if(entryRep){
                      this.entryReps[entry._id]=entryRep;
                    }else{
                      delete this.entryReps[entry._id];
                    }
                  }});
              });
              break;
            default:
              throw new Error("Undefined type: "+this.props.block.buildingBlockType);
          }

      return structure;
    }

    /**
     * onRemoveEntry
     * @param {*} e - entry wich should be removed
     * if entry is of type plain, it simply gets removed
     * if type link, the entry and its linked target entry are removed both
     * entrys of type link cannot be removd on their own
     *  -> pushes callback to parent
     */
    onRemoveEntry(e){
      let entry = Object.values(this.props.block.entries)[e.index]
      entry.index = e.index;
      switch(this.props.block.buildingBlockType){
      case 'data' :
        this.props.actions.onRemoveEntry(entry, this.props.block._id);
        break;
      case 'link' :
        //let target = {};
        //target.index = en.index;
        //this.props.actions.onRemoveEntry(target, this.props.refblock._id);
        this.props.actions.onRemoveEntry(entry, this.props.block._id);
      break;
      default:
        return;
      }
    }

    createEmptyEntry(){
      let entry = createTextEntry();
      entry.content.text = "";
      switch(this.props.block.buildingBlockType){
        case 'data':
          entry.type="plain";
          break;
        case 'link':
          entry.type="link";
        break;
        default: return;
      }
      return entry;
    }

    addTextEntry(text="",title="default",bindFocus=false){
      let entry = createTextEntry(text);
      this.props.actions.onAddEntry(entry,this.props.block._id);
      if(bindFocus) window.setTimeout(this.focusEntry.bind(this),10,entry._id);
    }

    addLinkEntry(text="",title="default",bindFocus=false){
      let {linkIt, targIt, canvas} = createReferencePair(text, title, this.props.canvasid)
      let blocks={
        [this.props.block._id]:{
          [linkIt._id]:linkIt
        },
        [this.props.refblock._id]:{
          [targIt._id]:targIt
        }
      }
      this.props.actions.addEntryCanvas(this.props.canvasid,blocks,{[canvas._id]:canvas});
      if(bindFocus) window.setTimeout(this.focusEntry.bind(this),10,linkIt._id);
    }

    addEntry(text="",title="default", bindFocus=false){
      if ((typeof text)!=="string") throw new Error("Text has to be a string! (got "+JSON.stringify(text)+")");
      if(this.props.block.buildingBlockType === "data"){
        this.addTextEntry(text,title,bindFocus);
      }else if(this.props.block.buildingBlockType === "link"){
        this.addLinkEntry(text,title,bindFocus);
      }
    }

    onKeyDown(event, model){
      event.persist();
      let {shiftKey,key}=event;
      if(!shiftKey){
        let {selectionStart,selectionEnd}=event.target;
        let isSelection=(selectionEnd!==selectionStart);
        switch(key){
          case "Enter":
            if(isSelection) return;
            if(selectionStart!==model.content.text.length) return;
            this.addEntry("",null,true);
            break;
          /*case "Backspace":
            if(isSelection) return;
            if(selectionStart!==0) return;
            if(model.content.text!=="") return;
            let keyList=Object.keys(this.props.block.entries);
            let ownIndex=keyList.indexOf(model._id);
            let focusTarget=null;
            if(ownIndex>0){
              focusTarget=keyList[ownIndex-1];
            }else if(keyList.length>1){
              focusTarget=keyList[0];//I don't know why this has to be a '0', the focus appears to be selected *after* the removal?
            }
            this.onRemoveEntry(Object.assign({index: ownIndex},model));
            if(focusTarget)
              this.focusEntry(focusTarget);
            break;*/
          default:
            return;
        }
        event.preventDefault();
      }
  }

  reformatImportText(input){
    //Better be safe than sorry and not autoformat anything with a "?", might be something like "spam.stuff.io/autosubscribe?deref=friendly.png"
    if(input.startsWith("data:image")||/^http(?:s?):\/\/[\d\w]+\.[^?]+\/[^?]+\.(jpg|gif|png|bmp)$/.test(input))
      return `![](${input})`
    return input;
  }


  onDragDrop(event, entryID=undefined){
    event.stopPropagation();
    event.preventDefault();
    let textContent = event.dataTransfer.getData("text");
    let jsonContent = null;
    let source;
    let textMarkers;
    let targetPosition=-1;
    if (entryID)
      targetPosition=Object.keys(this.props.block.entries).indexOf(entryID);
    try {
      jsonContent = JSON.parse(event.dataTransfer.getData("json"));
      source = jsonContent.source;
      textMarkers=jsonContent.textMarkers;
    } catch (error) {
      source=null;
      textMarkers=null;
    }
    if (source) {
      if(textMarkers){
        let {start,end}=textMarkers;
        let sourceEntry=this.props.findEntryByIDs(source.entry,source.block,source.canvas);
        if((!sourceEntry)||(sourceEntry.content.text.substring(start,end)!==textContent)){
          this.addEntry(textContent);
          console.log("Could not verify text-source, creating new entry instead");
        }else if(this.props.block.buildingBlockType!=="data"){
          this.addEntry(textContent);
          console.log("Cannot extract to link block, creating new entry instead");
        }else{
          let newText=sourceEntry.content.text
          newText=newText.substring(0,start)+newText.substring(end);
          let newEntry=createTextEntry(textContent);
          this.props.onChangeAdd([{
              ...sourceEntry,content:{...sourceEntry.content,text:newText}},
              source.block,source.canvas],
            [newEntry,this.props.block._id,this.props.canvasid]);
        }
      }else
        this.pullEntry(source,targetPosition);
    } else if (textContent){
      this.addEntry(this.reformatImportText(textContent));
    }
  }

  onDragOver(event, entryID=undefined){
    event.preventDefault();
    //event.persist();
    event.dataTransfer.dropEffect = "move"
    //console.log("Drag over:",event.target);
  }

    focusEntry(entryID){
      if(this.entryReps[entryID]){
        if(this.entryReps[entryID].onFocus)
          this.entryReps[entryID].onFocus();
        if(this.entryReps[entryID].textArea){
          this.entryReps[entryID].textArea.focus();
          return true;
        }
      }
      return false;
    }

    pullEntry(source,targetPosition=-1){
      let {canvas,block,entry}=source;
      if(this.props.canvasid !== canvas) throw new Error("Inter-canvas drag&drop is not supported yet");//TODO
      if(targetPosition!==-1)
        this.props.moveEntry(block,entry,this.props.block._id,targetPosition);
      else
        this.props.moveEntry(block,entry,this.props.block._id);
    }

    /**
     * onChangeEntry
     * @param {*} e - entry wich content changed
     *  -> pushes callback to parent
     */
    onChangeEntry(e){
      this.props.actions.onChangeEntry(e, this.props.block._id);
    }

    /**
     * onReferenceCall
     * @param {*} linkIt - link entry wich is clicked
     * @deprecated
     *  -> pushes callback to parent
     */
    onReferenceCall(linkIt){
      this.props.actions.onReferenceCall(linkIt);
    }

    /**
     * render : from react.component : renders the BuildBlock
     */
    render() {

      //first, check if block is editable
      let editable = true;
      let canAdd = true;
      //if target block, no entries can be added directly
      if(this.props.block.buildingBlockType === 'target'){
        canAdd = false;
        editable = false;
      }
      //maybe you have no rights or are in history mode
      if(this.props.editable === false){
        editable = false;
      }
      //mybe the block is locked by actions from other users
      if(this.props.lockings !== undefined && this.props.lockings.indexOf(this.props.block._id) > -1){
        editable = false;
      }
      
      if (this.state.printing){
        editable=false;
        canAdd=false;
      }

      //build structure (layout) fro react-dazzle lib
      let structure = this.buildStructure();
      return(
        <Segment className={this.props.className} onDragOver={this.onDragOver.bind(this)} onDrop = {this.onDragDrop.bind(this)} >
        <div style={this.props.style}>
        <span>
        <h3>{this.props.block.title}   {this.props.help&&(this.state.printing?undefined:true)&&(<Helper topic={this.props.help}/>)}</h3>
      </span>
        <Dashboard
          widgets = {structure.widgets}
          layout = {structure.layout}
          editable = {editable}
          onRemove = {this.onRemoveEntry.bind(this)}
          onAdd = {this.addEntry.bind(this)}
          onChange ={this.onChangeEntry.bind(this)}
          entryDragOver = {this.onDragOver.bind(this)}
          entryDrop = {this.onDragDrop.bind(this)}
          //dragable = {false}
          canAdd = {canAdd}
      /></div>
          </Segment>
        );
    }

}

export default BuildBlock;
