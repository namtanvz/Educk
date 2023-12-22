/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
// import { messageHandler } from '@estruyf/vscode/dist/client';
import "./styles.css";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
// import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { BsArrowUpShort } from "react-icons/bs";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi";
import { Container } from "react-bootstrap";
import Navbar from "./components/Navbar/Navbar";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components";
import Prism from "prismjs";
// import * as dotenv from 'dotenv';
import { messageHandler } from "@estruyf/vscode/dist/client";
import axios from "axios";

interface Message {
  title: string;
  role: "user" | "system";
  content: string;
}

// const EDUCK_API = process.env.EDUCK_API;

export interface IAppProps {}

export const App: React.FunctionComponent<
  IAppProps
> = ({}: React.PropsWithChildren<IAppProps>) => {
  const [message, setMessage] = React.useState<string>("");
  const [inputValue, setInputValue] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showPromptsButton, setShowPromptsButton] = React.useState<boolean>(true);
  const [currentTitle, setCurrentTitle] = React.useState<string>("");
  const [newMessageAdded, setNewMessageAdded] = React.useState<boolean>(false);
  const [chatHistory, setChatHistory] = React.useState<Message[]>();
  const chatOutputRef = React.useRef<HTMLDivElement>(null);
  
  const [code, setCode] = React.useState<string>("");
  const [question, setQuestion] = React.useState<string>("");
  const [editorError, setEditorError] = React.useState<string[]>([""]);
  const local = "http://localhost:8000";

  React.useEffect(() => {
    if (message) {
      const systemMessage: Message = {
        title: currentTitle,
        role: "system",
        content: message
      };
      setChatHistory((chatHistory) => [...(chatHistory || []), systemMessage]);
      setNewMessageAdded(true);
  
    }
  }, [message]);
  

  const requestEditorText = () => {
    messageHandler.request<string>('GET_EDITOR_TEXT').then((text) => {
      setCode(text);
    });
  };

  const extractQuestionFromCode = (text : string) => {
    const match = text.match(/'''([\s\S]+?)'''([\s\S]+)/);
    if(match) {
      const extractQuestion = match[1].trim();
      const extractCode = match[2].trim();

      setQuestion(extractQuestion);
      setCode(extractCode);
    }
  };

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      getMessage(inputValue);
    }
  };

  const togglePrompts = () => {
    setShowPromptsButton(!showPromptsButton);
    if (!showPromptsButton) {
      setNewMessageAdded(true);
    }
  };

  const handlePromptClick = async () => {
    requestEditorText();
    const query = JSON.stringify({
      question: question,
      curr_code: code,
    });
    console.log(query);
    const url = new URL('http://localhost:8000/dev/basic-knowledge');
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: query,
      }).then((response) => {response.json().then((data) => {
        console.log(data);
        setMessage(data.response);
        setNewMessageAdded(true);
      }).finally(() => { setIsLoading(false); });
    });
  };

  const getMessage = async (message: string) => {
    const messageTitle = currentTitle || inputValue;
    console.log(messageTitle);
    if (!currentTitle) {
      setCurrentTitle(inputValue);
    }
    const userMessage: Message = {
      title: messageTitle,
      role: "user",
      content: inputValue,
    };

    setChatHistory((chatHistory) => [...(chatHistory || []), userMessage]);
    setNewMessageAdded(true);
    setInputValue("");
    setMessage("");
    setIsLoading(true);

    try {
      const url = new URL('http://localhost:8000/dev/test_prompt');
      url.searchParams.append('user_prompt', inputValue); // Assuming inputValue is what you want to send
      const response = await fetch(url.toString());
      const data = await response.json();
      setMessage(data.response);
      console.log(data);
      setNewMessageAdded(true);
    } catch (error) {
      console.log(error);
    } finally { setIsLoading(false); }
  };

  const highlightCode = (msg: any) => {
    const messageText = typeof msg === 'string' ? msg : '';
  
    const hasOpeningTicks = messageText.includes('```') && !messageText.includes('```', messageText.indexOf('```') + 3);
    const correctedMessage = hasOpeningTicks ? `${messageText}\`\`\`` : messageText;
    const formattedMessage = correctedMessage.replace(/```(\w+)?\s*([\s\S]+?)```/g, (match, lang = 'plaintext', code) => {
      const validLang = Prism.languages[lang] ? lang : 'plaintext';
      const langClass = `language-${validLang}`;
      const langTitle = lang || 'code';
      const highlightedCode = validLang === 'plaintext' ? code : Prism.highlight(code, Prism.languages[validLang], validLang);
      return `<div class="code-block">
                <div class="code-title">${langTitle}</div>
                <pre><code class="${langClass}">${highlightedCode}</code></pre>
              </div>`;
    });
    return { __html: formattedMessage };
  };

  React.useEffect(() => {
    if (chatOutputRef.current && newMessageAdded) {
      chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
      setNewMessageAdded(false);
    }
  }, [newMessageAdded]);

  const chatMessage = (chatHistory ?? []).filter(
    (chatHistory) => chatHistory.title === currentTitle
  );

  return (
    <div className={"app"}>
      <Navbar />
      <div className={`bodyContainer ${showPromptsButton ? 'bodyContainerWithPrompts' : ''}`} ref={chatOutputRef}>
        <Container className="main">
          <div className="chatOutput" >
          <ul className="feed">
            {chatMessage.map((message, index) => (
              <li key={index} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                <div className="role-icon"></div>
                <p className="outPutMessages" dangerouslySetInnerHTML={highlightCode(message.content)}></p>
              </li>
            ))}
            {isLoading && (
            <li className="message assistant-message">
              <div className="role-icon"></div>
              <p className="outPutMessages" dangerouslySetInnerHTML={highlightCode("educk is typing...")}></p>
            </li>
          )}
          </ul>
          </div>
        </Container>
        <Container className="input">
          <div className="bottomSection">
            <button onClick={togglePrompts} className="btn">
              {showPromptsButton ? (
                <HiOutlineChevronDown className="buttonPrompt" />
              ) : (
                <HiOutlineChevronUp className="buttonPrompt" />
              )}
            </button>
            {showPromptsButton && (
              <div className="prompt-buttons">
                <button onClick={handlePromptClick} className="btn">
                  <div className="promptName">Basic Syntax</div>
                  <div className="promptDescription">Prompt Description</div>
                </button>
                <button onClick={handlePromptClick} className="btn">
                  <div className="promptName">Basic Knowledge</div>
                  <div className="promptDescription">Prompt Description</div>
                </button>
                <button onClick={handlePromptClick} className="btn">
                  <div className="promptName">Take my Error</div>
                  <div className="promptDescription">Prompt Description</div>
                </button>
                <button onClick={handlePromptClick} className="btn">
                  <div className="promptName">I don't know what to do</div>
                  <div className="promptDescription">If you have no idea, click here</div>
                </button>

              </div>
            )}
            <div className="inputContainer">
              <input
                className="inputText"
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                value={inputValue}
                onChange={handleInputChange}
              />
              <div id="submit" onClick={() => getMessage(inputValue)}>
                <BsArrowUpShort className="submit-icon" />
              </div>
            </div>
            <p className="info">
              Adapting LLMs As An Educational Tool For Learning To Code
            </p>
          </div>
        </Container>
      </div>
    </div>
  );
};
