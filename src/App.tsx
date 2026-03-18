import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, Scale, BookOpen, Gavel, ScrollText, LayoutDashboard, Upload, ChevronRight, Book, ArrowRight, ArrowLeft, AlertTriangle, ArrowLeftRight, Sparkles, Send, Bot, FileText, Users, Calendar, CheckCircle, XCircle, ShieldAlert, X, Menu, BrainCircuit, Plus, Paperclip, ChevronDown, Mic, Quote, Copy } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./lib/utils";
import { Toaster, toast } from "sonner";
import { 
  generateAcademicAnalysisStream, 
  generateMootAnalysisStream, 
  generateStatutoryConversionStream, 
  generateResearchResponseStream, 
  generateBareActTextStream, 
  generateCaseAnalysis, 
  generateMaximExplanationStream, 
  generateDoctrineExplanationStream, 
  generateDraftStream
} from './services/gemini';
import LandingPage from './components/LandingPage';

/**
 * LEXALYSE - PROFESSIONAL INTERFACE
 * Primary Palette: Matte Black (#1A1A1A), Light Grey (#F5F5F7)
 * Font: INTER
 */

interface Act {
  id: string;
  title: string;
  year: string;
  description: string;
  fullName?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  files?: { name: string, data: string, mimeType: string }[];
}

interface CaseAnalysis {
  caseName: string;
  citation: string;
  year: string;
  bench: string;
  tags: string[];
  facts: string;
  coreIssues: string;
  arguments: string;
  judgement: string;
  holding: string;
  ratioDecidendi: string;
  status: string;
  primarySourceUrl: string;
}

const LexalyseApp = () => {
  const [activeTab, setActiveTab] = useState('dash');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAct, setSelectedAct] = useState<Act | null>(null);
  const [academicSearch, setAcademicSearch] = useState('');
  const [mootSide, setMootSide] = useState('petitioner');
  const [mootArgument, setMootArgument] = useState('');
  const [bridgeConversionType, setBridgeConversionType] = useState('IPC -> BNS');
  const [bridgeSection, setBridgeSection] = useState('');
  
  // Repository State
  const [repoSearch, setRepoSearch] = useState('');
  const [caseResult, setCaseResult] = useState<CaseAnalysis | null>(null);
  const [isRepoLoading, setIsRepoLoading] = useState(false);
  const [selectedCaseApiData, setSelectedCaseApiData] = useState<any>(null);
  const [isCaseApiLoading, setIsCaseApiLoading] = useState(false);

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatFiles, setChatFiles] = useState<{ name: string, data: string, mimeType: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'AIzaSyAw9esDhBizCmxlBYWhIHTFwKgLsD7s5jo') {
      toast.error("Gemini API Key is missing or invalid", {
        description: "Please check your .env file for local development.",
        duration: 10000,
      });
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Gemini Integration States
  const [academicAnalysis, setAcademicAnalysis] = useState<string | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [isAcademicLoading, setIsAcademicLoading] = useState(false);
  
  const [mootAnalysis, setMootAnalysis] = useState<string | null>(null);
  const [isMootLoading, setIsMootLoading] = useState(false);

  const [bridgeResult, setBridgeResult] = useState<string | null>(null);
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);

  // Legal Maxims State
  const [maximSearch, setMaximSearch] = useState('');
  const [maximResult, setMaximResult] = useState<string | null>(null);
  const [isMaximLoading, setIsMaximLoading] = useState(false);

  // Doctrines State
  const [doctrineSearch, setDoctrineSearch] = useState('');
  const [doctrineResult, setDoctrineResult] = useState<string | null>(null);
  const [isDoctrineLoading, setIsDoctrineLoading] = useState(false);
  const [selectedDoctrine, setSelectedDoctrine] = useState<string | null>(null);

  // DraftDash State
  const [draftType, setDraftType] = useState('Legal Notice');
  const [customDraftType, setCustomDraftType] = useState('');
  const [draftDetails, setDraftDetails] = useState('');
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // Theme State
  const isDarkMode = true;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Auto-switch theme based on active tab removed

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Example Cases Data
  const EXAMPLE_CASES: CaseAnalysis[] = [
    {
      caseName: "Kesavananda Bharati v. State of Kerala",
      citation: "AIR 1973 SC 1461",
      year: "1973",
      bench: "13 Judges (Full Bench)",
      tags: ["Constitution", "Basic Structure", "Fundamental Rights"],
      facts: "Swami Kesavananda Bharati challenged the Kerala government's land reform acts restricting management of his property. The petition expanded to challenge the 24th, 25th, and 29th Constitutional Amendments.",
      coreIssues: "Whether Parliament has unlimited power to amend the Constitution under Article 368.",
      arguments: "Petitioner: Parliament cannot alter the essential features. Respondent: Parliament has unlimited power.",
      judgement: "By a narrow majority of 7:6, the Supreme Court held that while Parliament has wide powers to amend the Constitution under Article 368, this power is not unlimited.",
      holding: "The Court introduced the 'Basic Structure Doctrine'. It held that any amendment that alters the basic structure (democracy, secularism, federalism, judicial review, etc.) is ultra vires.",
      ratioDecidendi: "Parliament cannot alter the basic features of the Constitution. The power to amend is not a power to destroy.",
      status: "Valid",
      primarySourceUrl: "https://main.sci.gov.in/jonew/judis/4657.pdf"
    },
    {
      caseName: "Maneka Gandhi v. Union of India",
      citation: "AIR 1978 SC 597",
      year: "1978",
      bench: "7 Judges",
      tags: ["Article 21", "Personal Liberty", "Due Process"],
      facts: "Maneka Gandhi's passport was impounded by the government in 'public interest'. She was not given reasons or a hearing, challenging this as a violation of Article 21.",
      coreIssues: "Whether the procedure established by law under Article 21 must be fair, just and reasonable.",
      arguments: "Petitioner: Impounding without hearing violates natural justice. Respondent: Passport Act allows impounding in public interest.",
      judgement: "The Court expanded the scope of Article 21, ruling that 'procedure established by law' must be 'fair, just and reasonable', not fanciful, oppressive or arbitrary.",
      holding: "The right to travel abroad is part of personal liberty. The procedure for depriving liberty must satisfy the test of reasonableness and natural justice.",
      ratioDecidendi: "Article 21 is not a distinct code but interconnected with Articles 14 and 19. 'Procedure established by law' implies 'Due Process of Law'.",
      status: "Valid",
      primarySourceUrl: "https://main.sci.gov.in/jonew/judis/5314.pdf"
    },
    {
      caseName: "S.R. Bommai v. Union of India",
      citation: "AIR 1994 SC 1918",
      year: "1994",
      bench: "9 Judges",
      tags: ["Federalism", "Article 356", "Secularism"],
      facts: "Dismissal of state governments in Karnataka, Meghalaya, and others under Article 356 was challenged. The core issue was the scope of President's Rule.",
      coreIssues: "Scope of judicial review of Presidential Proclamation under Article 356.",
      arguments: "Petitioner: Dismissal was politically motivated. Respondent: President's satisfaction is subjective.",
      judgement: "The Court laid down strict guidelines for imposing President's Rule. It held that federalism and secularism are basic features of the Constitution.",
      holding: "Presidential Proclamation under Art 356 is subject to judicial review. The floor test is the only way to test a majority, not the Governor's opinion.",
      ratioDecidendi: "Secularism is a basic feature. Misuse of Art 356 to dismiss state governments on political grounds is unconstitutional.",
      status: "Valid",
      primarySourceUrl: "https://main.sci.gov.in/jonew/judis/11499.pdf"
    }
  ];

  const handleExampleClick = (example: CaseAnalysis) => {
    setCaseResult(example);
    setRepoSearch(example.caseName);
  };

  const handleCaseSearch = async () => {
    if (!repoSearch.trim()) return;
    setIsRepoLoading(true);
    setCaseResult(null);
    
    const result = await generateCaseAnalysis(repoSearch);
    if (result) {
      try {
        const parsed = JSON.parse(result);
        setCaseResult(parsed);
      } catch (e) {
        console.error("Failed to parse case analysis JSON", e);
      }
    }
    setIsRepoLoading(false);
  };

  const handleChatSubmit = async () => {
    if ((!chatInput.trim() && chatFiles.length === 0) || isAiLoading) return;
    
    const userMsg = chatInput;
    const currentFiles = [...chatFiles];
    
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, files: currentFiles }]);
    setChatInput('');
    setChatFiles([]);
    setIsAiLoading(true);

    try {
      const filesForAi = currentFiles.map(f => ({
        inlineData: {
          data: f.data.split(',')[1],
          mimeType: f.mimeType
        }
      }));

      // Add an empty message for the model that we will stream into
      setChatMessages(prev => [...prev, { role: 'model', text: '' }]);

      await generateResearchResponseStream(
        chatMessages.map(m => ({ role: m.role, text: m.text })),
        userMsg,
        (chunk) => {
          if (chunk.includes("QUOTA_EXCEEDED")) {
            toast.error("API Quota Exceeded", {
              description: "You've reached the Gemini API free tier limit. Please wait a minute or check your quota."
            });
          }
          setChatMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = chunk;
            return newMessages;
          });
        },
        filesForAi
      );
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("AI Research Error", {
        description: "I encountered an error connecting to the legal database. Please check your connection or API key."
      });
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'model' && !newMessages[newMessages.length - 1].text) {
          newMessages[newMessages.length - 1].text = "Error: Failed to generate response.";
        }
        return newMessages;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatFiles(prev => [...prev, {
          name: file.name,
          data: reader.result as string,
          mimeType: file.type
        }]);
        toast.success("File attached", {
          description: `${file.name} is ready for analysis.`
        });
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setChatFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAcademicAnalysis = async () => {
    if (!selectedAct) return;
    const query = sectionSearchQuery.trim() || "General Overview";
    
    setIsAcademicLoading(true);
    setAcademicAnalysis("");
    
    const actNameWithYear = selectedAct.year && selectedAct.year !== 'Various' && selectedAct.year !== 'Common Law'
      ? `${selectedAct.title} (${selectedAct.year})` 
      : selectedAct.title;

    const fullActContext = selectedAct.fullName 
      ? `${selectedAct.fullName} (${selectedAct.year})`
      : (selectedAct.description ? `${actNameWithYear} (Full Name: ${selectedAct.description})` : actNameWithYear);

    // Only fetch analysis by default to save API quota
    await generateAcademicAnalysisStream(fullActContext, query, (chunk) => setAcademicAnalysis(chunk));
    
    setIsAcademicLoading(false);
  };

  const handleMootAnalysis = async () => {
    if (!mootArgument.trim()) return;
    setIsMootLoading(true);
    setMootAnalysis("");
    await generateMootAnalysisStream(mootSide, mootArgument, (chunk) => setMootAnalysis(chunk));
    setIsMootLoading(false);
  };

  const handleBridgeConversion = async () => {
    if (!bridgeSection.trim()) return;
    setIsBridgeLoading(true);
    setBridgeResult("");
    await generateStatutoryConversionStream(bridgeConversionType, bridgeSection, (chunk) => setBridgeResult(chunk));
    setIsBridgeLoading(false);
  };

  const handleMaximSearch = async (maxim?: string) => {
    const query = maxim || maximSearch;
    if (!query.trim()) return;
    
    setIsMaximLoading(true);
    setMaximResult(null);
    if (maxim) setMaximSearch(maxim);
    
    // Check if it's in our provided list first
    const provided = PROVIDED_MAXIMS.find(m => m.term.toLowerCase() === query.toLowerCase());
    if (provided) {
      setMaximResult(`### THE MAXIM\n**${provided.term}**\n\n### DEFINITION\n${provided.definition}`);
      setIsMaximLoading(false);
      return;
    }
    
    // Fallback to Gemini for other maxims
    setMaximResult("");
    await generateMaximExplanationStream(query, (chunk) => setMaximResult(chunk));
    setIsMaximLoading(false);
  };

  const handleDoctrineAnalysis = async (doctrine: string) => {
    setIsDoctrineLoading(true);
    setSelectedDoctrine(doctrine);
    setDoctrineResult("");
    
    await generateDoctrineExplanationStream(doctrine, (chunk) => setDoctrineResult(chunk));
    setIsDoctrineLoading(false);
  };

  const handleDraftGeneration = async () => {
    if (!draftDetails.trim()) return;
    setIsDraftLoading(true);
    setDraftResult("");
    const finalType = draftType === 'Other / Custom' ? customDraftType : draftType;
    await generateDraftStream(finalType || 'Legal Document', draftDetails, (chunk) => setDraftResult(chunk));
    setIsDraftLoading(false);
  };

  const handleSourceClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCaseApiLoading(true);
    setSelectedCaseApiData(null);
    try {
      const response = await fetch('https://apis.akshit.net/eciapi/17/district-court/case');
      const data = await response.json();
      setSelectedCaseApiData(data);
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setIsCaseApiLoading(false);
    }
  };

  const PROVIDED_MAXIMS = [
    { term: "Ab initio", definition: "From the very beginning." },
    { term: "Ab invito", definition: "Against one’s will. For instance, taking something from someone else without their consent is referred to as a transfer ab invito." },
    { term: "Actus me invito factus non est mens actus", definition: "An act done by one against one’s will is not one’s act." },
    { term: "Act malum in se", definition: "An unlawful act itself renders the accused liable for all the natural consequences arising from this act, for e.g. shooting at poultry, intending to steal it but accidentally kills a man, he will be liable to murder." },
    { term: "Actio qualibet it sua via", definition: "Every action follows it prescribed course." },
    { term: "Actore incumbit onus probandi", definition: "Burden of proof lies on the plaintiff." },
    { term: "Affirmanti non neganti incumbit probatio", definition: "The burden of proof lies upon him who affirms, not upon him who denies." },
    { term: "Actori non probante absolvitur reus", definition: "When the plaintiff does not prove his case the defendant is absolved." },
    { term: "Actus curiae neminem gravabit", definition: "An act of court shall prejudice no one." },
    { term: "Actus legis nemini est demnosus/injurium", definition: "An act in law shall prejudice none; the act of the law hurts none." },
    { term: "Actus non facit reum, nisi mens sit rea", definition: "Act itself does not constitute unless done with intent of guilt." },
    { term: "Actus reus", definition: "Criminal Act." },
    { term: "Ad curiam", definition: "At a Court." },
    { term: "Ad hoc", definition: "For a particular case at hand." },
    { term: "Ad interim", definition: "In the meantime." },
    { term: "Ad tunc et ibidem", definition: "At the time and in the same place." },
    { term: "Aedificatum solo, solo credit", definition: "What is built upon the land goes with the land." },
    { term: "Aequitas est aequalitus", definition: "Equity is equality." },
    { term: "Aequitas non facit jus sed juri auxilatur", definition: "Equity does not make law, but assists law." },
    { term: "Aequitas nunquam contravenit legis", definition: "Equity never counteracts the law" },
    { term: "Aequitus sequitur legem", definition: "Equity follows the law." },
    { term: "Aggregatio mentium", definition: "the meeting of the minds, when the contract is complete." },
    { term: "Assensio mentium", definition: "Meeting of minds during mutual consent." },
    { term: "Alias", definition: "The second name of a person who is known by more than one name." },
    { term: "Amicus Curiae", definition: "A friend of the Court is a member of the Bar or other stand by, who informs the Court when it is doubtful or mistaken of any fact or decided case. A Counsel provided by the State to an accused who is not represented by a Counsel." },
    { term: "Arguendo", definition: "In the course of argument." },
    { term: "Arma in armatos sumere jura sinunt", definition: "The law permits us to take up arms against the armed." },
    { term: "Audietur et altera pars", definition: "Hear the other side." },
    { term: "Audi alteram partem", definition: "No one should be condemned unheard, one of the Principles of Natural Justice." },
    { term: "Augusta legibus soluta non est", definition: "Even the queen is not exempted from subjection to the laws of the Country." },
    { term: "Autre fois acquit/convict", definition: "Previous acquittal/conviction by a competent court of law is a bar to further prosecution for the same offence." },
    { term: "Bona fide", definition: "With good faith." },
    { term: "Bona gestura", definition: "Good behavior." },
    { term: "Bona vacantia", definition: "Goods without an apparent owner in which no one claims a property, such as lost property or the personal property of an intestate without next of kin." },
    { term: "Boni judicis est causas litium dirimere", definition: "It is the duty of a good judge to remove the causes of litigation." },
    { term: "Boni judicis est judicium sine dilatione mandare excutioni", definition: "It is the duty of a good judge to cause judgement to be executed without delay." },
    { term: "Bonum vacans", definition: "property without an owner of any sort." },
    { term: "Causa mortis", definition: "Cause of death." },
    { term: "Causa turpis", definition: "illegal consideration." },
    { term: "Caveat", definition: "A caveat is a notice to the Register or officer of the court not to let anything be done by anybody in the matter of the will or the goods of the deceased without notice to the person who lodges the caveat." },
    { term: "Caveat emptor", definition: "Let the buyer beware." },
    { term: "Caveat viator", definition: "Let the traveler beware." },
    { term: "Certiorari", definition: "A prerogative writ of superior court to call for the records of an inferior court or body acting in judicial or quasi judicial capacity. The Indian Constitution’s Articles 32 and 226 give the Supreme Court and the High Courts, respectively, the authority to issue writs or directives in the form of prohibition, certiorari, mandamus, quo warranto, and habeas corpus." },
    { term: "Certiorarified mandamus", definition: "A merger of the two writs viz. certiorari and mandamus." },
    { term: "Contra jus", definition: "Against the law." },
    { term: "Contra legem", definition: "Against the law of the land." },
    { term: "Coram non judice", definition: "Without jurisdiction." },
    { term: "Corpus", definition: "Complete collection of laws." },
    { term: "Corpus delicti", definition: "Body, substance or foundation of an offence." },
    { term: "Cujus est commodum ejus est onus", definition: "He who has the benefit has also the burden" },
    { term: "Cujus est commodum ejus debet esse incommodum", definition: "whose is the advantage, his also should be the disadvantage" },
    { term: "Culpa lata", definition: "Gross negligence." },
    { term: "Culpable", definition: "Punishable." },
    { term: "Damni injurie actio", definition: "An action against one for an intentional injury." },
    { term: "Damnum sine injuria", definition: "damage without injury." },
    { term: "De domo reparanda", definition: "A writ to compel a man to repair his house when dangerous to the neighbours." },
    { term: "De facto doctrine", definition: "It is a doctrine of necessity and public policy to clear the confusion and settle the chaos in the tangled web of human affairs." },
    { term: "De jure", definition: "by law." },
    { term: "De minimis non curat lex", definition: "Law does not take account of trifles." },
    { term: "De novo", definition: "from beginning." },
    { term: "De placito", definition: "in an action." },
    { term: "De tempore in tempus et ad omnia tempora", definition: "from time to time and at all times." },
    { term: "Debet esse finis litum", definition: "There ought to be an end of law suits." },
    { term: "Debet quis juris subjacere ubi delinquit", definition: "Everyone ought to be subject to the law of the place where he offends." },
    { term: "Decipi quam fallere est tutius", definition: "It is safer to be deceived than to deceive." },
    { term: "Dictum", definition: "A statement of law made by a Judge in the course of the decision of a case." },
    { term: "Dies a quo", definition: "The day from which." },
    { term: "Dies a quom", definition: "The day to which." },
    { term: "Dies juridicus", definition: "A court day or a day for judicial proceedings." },
    { term: "Dieu son acte", definition: "Act of God." },
    { term: "Doli incapax", definition: "incapable of commiting crime." },
    { term: "Dolus auctoris non nocent successori", definition: "The fraud of a predecessor does not prejudice his successor." },
    { term: "Donation vilata", definition: "A hidden gift." },
    { term: "Dormiunt aliquando leges, nunquam moriuntur", definition: "Laws sometimes sleep but never die." },
    { term: "Droit ne done pluis que soit demaunde", definition: "Justice gives no more than is demanded." },
    { term: "Doti lex favet, praemium pudoris est, ideo parcatur", definition: "The law favors dower, it is the reward of chastity, therefore let it be preserved" },
    { term: "Error qui non resistitur , approbatur", definition: "An error which is not resisted is approved." },
    { term: "Erubescit lex filios castigare parentes", definition: "The law blushes when children correct their parents." },
    { term: "Ex adverso", definition: "On the other side." },
    { term: "Ex facto jus oritur", definition: "The law depends in the fact." },
    { term: "Exceptio nulla est versus actionem quae exceptionem perimit", definition: "There is no plea against an action which destroys the subject or matter of the plea." },
    { term: "Exceptio quae firmat legem exponit legem", definition: "An exception which confirms a law expounds the law." },
    { term: "Experiential docet", definition: "Experience teaches." },
    { term: "Extra judicium", definition: "Out of the court." },
    { term: "Extra jus", definition: "Beyond the law." },
    { term: "Ex testamento", definition: "By will." },
    { term: "Facilis est lapsus juventutis", definition: "Youth is very liable to err." },
    { term: "Facta sunt potentiora verbis", definition: "Facts are more powerful than words." },
    { term: "Factum infectum fieri aequit", definition: "What is done cannot be undone." },
    { term: "Factum probandum", definition: "Principal fact to be proved." },
    { term: "Factum unuis alteri noceri non debet", definition: "The deed of one should not hurt another." },
    { term: "Fatetur facinus qui judicium fugit", definition: "He who flees from judgment confesses his guilt." },
    { term: "Fiat", definition: "a decree." },
    { term: "Fiat justitia", definition: "Let justice be done." },
    { term: "Forum actus", definition: "Forum where the act was done." },
    { term: "Forum contentiosum", definition: "Place of litigation." },
    { term: "Fraus et just nunquam cohabitant", definition: "Fraud and justice never dwell together." },
    { term: "Frustra probatur quod probatum non relevant", definition: "It is vain to prove that which if proved would not aid the matter in issue." },
    { term: "Generalis regula generaliter est intelligenda", definition: "General rules must be generally understood." },
    { term: "Grammatica falsa non vitiat chartum", definition: "Bad grammer does not vitiate a deed." },
    { term: "Haereditas ab intestato", definition: "Succession from an intestate." },
    { term: "Haeres de facto", definition: "An heir from the deed or act of the ancestor." },
    { term: "Haeres ex asse", definition: "A sole heir." },
    { term: "Haeres factus", definition: "An heir appointed by will." },
    { term: "Haereditus nunquam ascendit", definition: "Inheritance never ascends." },
    { term: "Id est", definition: "That is, abbreviated as i.e." },
    { term: "Ibidem, ibid, id", definition: "In the same place, volume or case." },
    { term: "Idem ad", definition: "“Of the same mind” i.e. is agreed. That is necessary element of a valid contract." },
    { term: "Ideo", definition: "Therefore." },
    { term: "Ideo consideratum est", definition: "Used in the body of judgment, means, ‘therefore it is considered’." },
    { term: "Ides", definition: "15th day of March, May, July, and October, and 13th day of other months." },
    { term: "Ignorantia facit excusat , ignorantia juris (legis) non excusat", definition: "Ignorance of fact may excuse but not ignorance of law." },
    { term: "Ignorantia juris sui non praejudicat juri", definition: "Ignorance of one’s right does not prejudice the right." },
    { term: "Ignorantia praesumitar ubi scientia non probatur", definition: "Ignorance is presumed where knowledge is not proved." },
    { term: "In articulo mortis", definition: "Statement made by a man in articulo mortis, called a dying declaration, can be given in evidence after his death on the trial of any one accused of his murder or manslaughter." },
    { term: "In atrocioribus delictis punitur affectus licet non sequatur effectus", definition: "In more atrocious crimes, the intent is punished though the effect does not follow." },
    { term: "In autre droit", definition: "In another’s right, a representative capacity, an executor who sues for a debt due to his testator is said to sue in autre droit." },
    { term: "In cujus rei testimonium", definition: "In witness whereof." },
    { term: "In curia", definition: "In the open court." },
    { term: "In custodia legis", definition: "In legal custody." },
    { term: "In delicto", definition: "in default." },
    { term: "In diem", definition: "For a day." },
    { term: "In exitu", definition: "In issue." },
    { term: "In facto", definition: "infact, indeed." },
    { term: "In favorem vitae, libertatis, et innocentiae omnia praesumuntur", definition: "In favor of life, liberty and innocence all things are to be presumed." },
    { term: "In gremoi legis", definition: "under the protection of law." },
    { term: "In initio", definition: "In the beginning." },
    { term: "In exercise", definition: "when anything is done under a power." },
    { term: "In judicio", definition: "In court." },
    { term: "In litem", definition: "during the litigation." },
    { term: "In loco", definition: "In the place." },
    { term: "In maxima potentia minima licentia", definition: "In the greatest power there is the least liberty." },
    { term: "In memorium", definition: "In memory of." },
    { term: "In mora", definition: "In default." },
    { term: "In Pais", definition: "Out of the Court." },
    { term: "In person", definition: "Personally." },
    { term: "In personam", definition: "Against a particular person." },
    { term: "In posterum", definition: "in future." },
    { term: "In praesenti", definition: "At present." },
    { term: "In primis", definition: "in the first place." },
    { term: "In status quo", definition: "In the same state." },
    { term: "In toto", definition: "Totally." },
    { term: "Incognito", definition: "Unknown, person whose name and identity is concealed." },
    { term: "Initialia testimonii", definition: "Preliminary examination of a witness." },
    { term: "Injuria", definition: "Tortious Act." },
    { term: "Injuria non excusat injuriam", definition: "A wrong does not excuse a wrong." },
    { term: "Injuria servi dominum pertinit", definition: "The master is liable for injury done by his servants." },
    { term: "Injuria sine damno", definition: "Injury without damage." },
    { term: "Inter alia", definition: "Among other things." },
    { term: "Inter vivos", definition: "Between living persons" },
    { term: "Interim", definition: "Meanwhile, in the meantime." },
    { term: "Intra vires", definition: "Within the powers or authority." },
    { term: "Ipse dixit", definition: "He said it himself, no other authority is needed." },
    { term: "Ipso facto", definition: "By the fact itself." },
    { term: "Ipso jure", definition: "by the law itself." },
    { term: "Judex ad quem", definition: "A judge to whom an appeal is made." },
    { term: "Judicandum est legibus, non exemplis", definition: "Judgment is to be given according to the laws, not according to examples." },
    { term: "Judicis posterioribus fides est abhibenda", definition: "Credit is to be given to the later decisions." },
    { term: "Judicium capitale", definition: "Capital judgment." },
    { term: "Jure naturae", definition: "According to the law of nature." },
    { term: "Jus civitatis", definition: "Right of citizenship." },
    { term: "Jus in re aliena", definition: "A right of a person in the property of others. It consists 1) Lease 2) Servitude 3) Security and 4) Trust." },
    { term: "Jus legitimum", definition: "Legal right." },
    { term: "Justitia nec differenda nec neganda est", definition: "Justice is not be denied or delayed." },
    { term: "Justitia prepondrous", definition: "Speedy justice." },
    { term: "Lex fori", definition: "Law of the forum of court." },
    { term: "Lex loci", definition: "Law of the place." },
    { term: "Lex loci delicti delictus", definition: "Law of the place where the crime took place." },
    { term: "Lex vigilantibus, non dormientibus, subvenit", definition: "Law assists the wakeful, not the sleeping." },
    { term: "Lis pendens/pendente lite", definition: "During the pendency of suit." },
    { term: "Magis jus nostrum quam jus alienum servemus", definition: "We should follow our own rather than a foreign law." },
    { term: "Mala fide", definition: "Bad faith." },
    { term: "Mens rea", definition: "A guilty mind." },
    { term: "Minatur innocentibus qui parcit nocentibus", definition: "He threatens the innocent who spares the guilty." },
    { term: "Modus operandi", definition: "Manner of operating." },
    { term: "Modus vivendi", definition: "Manner of living." },
    { term: "Monumenta quae nos recorda vocamus sunt veritatis et vetustatis vestigia", definition: "Monuments which we call records are the vestiges of truth and antiquity." },
    { term: "Ne exeat", definition: "A writ prohibiting a person from leaving the place." },
    { term: "Ne quaere litem cum licet figere", definition: "Seek not a lawsuit when you can escape it." },
    { term: "Necessitus est lex temporis et loci", definition: "Necessity is the law of time and place." },
    { term: "Neminem laedit qui jure suo utitur", definition: "He who stands on his own rights, injures no one." },
    { term: "Nemo bis punitur vexatur pro eodem/nemo debet bis puniri pro uno delicto", definition: "No man is punished twice for the same offence." },
    { term: "Nemo judex in causa sua", definition: "No man shall be a judge of his own cause." },
    { term: "Nomen juris", definition: "Name of the law." },
    { term: "Non est", definition: "Never existing." },
    { term: "Onus propundi", definition: "Burden of proof." },
    { term: "Obiter dictum", definition: "An incidental opinion by a Judge which is not binding." },
    { term: "Omne nimium vertitur in vitium", definition: "Every excess becomes a vice." },
    { term: "Optima statuti interpretatrix est ipsum statutum", definition: "The best interpreter of statute is the statute itself." },
    { term: "Plures candem rem in solidum possidere non possunt", definition: "Two persons cannot be in possession of the same thing at the same time." },
    { term: "Plus valet unus oculatus testis quam auriti decem", definition: "On eyewitness is more than ten hearsay witnesses." },
    { term: "Pro bono publico", definition: "For the benefit of the public." },
    { term: "Per idiem", definition: "By the day." },
    { term: "Per se", definition: "By itself." },
    { term: "Per causa", definition: "With equal right." },
    { term: "Quasi judicial", definition: "Judicial in some sense, but not in every sense." },
    { term: "Quo warranto", definition: "A writ issued to restrain a person from acting in a public office to which he/she is not entitled." },
    { term: "Ratio decidendi", definition: "The principle or reasons underlying a decision." },
    { term: "Res ipsa loquitor", definition: "Thing speaks for itself." },
    { term: "Res sub judice", definition: "Matters pending in court." },
    { term: "Secundum subjectam materiam", definition: "According to the subject matter." },
    { term: "Salus populi est supreme lex", definition: "The welfare of the people is the supreme law." },
    { term: "Testis", definition: "Witness." },
    { term: "Testis corruptus", definition: "Corrupt witness." },
    { term: "Testamentum", definition: "A will." },
    { term: "Testimonium", definition: "A concluding part of a deed which generally begins with words, “In witness”." },
    { term: "Ui jus ibi idem remediem", definition: "Where there is a right, there is a remedy." },
    { term: "Ubi remedium, ubi jus", definition: "Where there is a remedy, there is a right." },
    { term: "Ultima voluntas", definition: "The last will." },
    { term: "Ultra vires", definition: "Beyond the scope, power or authority of any Company, Corporation or Statutory body." },
    { term: "Vadium mortuum", definition: "A deed of mortgage." },
    { term: "Vendicatio", definition: "A claim." },
    { term: "Veritas est justitiate mater", definition: "Truth is the mother of justice." },
    { term: "Vicarious liability", definition: "Liability of the master for the acts of the servant or agent done in the course." },
    { term: "Vice versa", definition: "The order being reversed." },
    { term: "Vis major", definition: "Act of God." },
    { term: "Vis-à-vis", definition: "The relationship of one of two persons or things to the other when facing or situated opposite each other." },
    { term: "Volenti non fit injuria", definition: "Defence that the plaintiff cannot claim damages for injury. sustained by him on account of his having consented to it." },
    { term: "Voluntas testatoris ambulatoria est esque ad mortem", definition: "The will of a Testator is ambulatory (changeable) until his death." },
    { term: "Vulgaris opinion", definition: "Common opinion." }
  ];

  const PROVIDED_DOCTRINES = [
    { 
      term: "Doctrine of Pith and Substance", 
      definition: "This doctrine is used to determine whether a particular law relates to a specific subject mentioned in the lists of the Seventh Schedule. It looks at the 'true nature and character' of the legislation to decide which list it falls under, even if it incidentally encroaches on another list." 
    },
    { 
      term: "Doctrine of Colorable Legislation", 
      definition: "This doctrine is based on the maxim 'what cannot be done directly, cannot be done indirectly'. It tests the competence of the legislature to enact a law. If a legislature lacks the power to make a law on a subject directly, it cannot do so by disguising it as something else." 
    },
    { 
      term: "Doctrine of Severability", 
      definition: "Also known as the Doctrine of Separability. It states that if a part of a statute is unconstitutional, only that part should be declared void, while the rest of the statute remains valid, provided the valid part can be separated from the invalid part." 
    },
    { 
      term: "Doctrine of Eclipse", 
      definition: "This doctrine states that any law which is inconsistent with fundamental rights is not dead but becomes overshadowed or 'eclipsed' by the fundamental right. It remains dormant and can be revived if the fundamental right is amended or removed." 
    },
    { 
      term: "Doctrine of Waiver", 
      definition: "This doctrine refers to the voluntary relinquishment of a known right. In Indian constitutional law, it is generally held that a person cannot waive their fundamental rights as they are not just for individual benefit but also for public policy." 
    },
    { 
      term: "Doctrine of Territorial Nexus", 
      definition: "This doctrine states that laws made by a State Legislature are applicable within that state. However, they can have extra-territorial operation if there is a sufficient 'nexus' or connection between the state and the object/subject of the law." 
    },
    { 
      term: "Doctrine of Harmonious Construction", 
      definition: "When there is a conflict between two or more statutes or parts of a statute, they should be interpreted in a way that gives effect to both. The court should avoid a head-on collision and try to harmonize them." 
    },
    { 
      term: "Doctrine of Pleasure", 
      definition: "Originating from English law, this doctrine states that a civil servant holds office during the pleasure of the Crown. In India, this is embodied in Article 310, but with safeguards provided under Article 311." 
    },
    { 
      term: "Doctrine of Laches", 
      definition: "This doctrine is based on the principle that 'equity aids the vigilant and not those who slumber on their rights'. It prevents a person from seeking a legal remedy if they have delayed unreasonably in bringing their claim." 
    },
    { 
      term: "Doctrine of Res Judicata", 
      definition: "This principle prevents the same parties from litigating the same issue again once it has been decided by a competent court. It ensures finality of litigation and prevents harassment of parties." 
    },
    { 
      term: "Doctrine of Stare Decisis", 
      definition: "This is the doctrine of precedent, which requires courts to follow the decisions of higher courts or their own previous decisions in similar cases to ensure consistency and predictability in law." 
    },
    { 
      term: "Doctrine of Basic Structure", 
      definition: "Established in the Kesavananda Bharati case, this doctrine states that while Parliament has the power to amend the Constitution, it cannot alter or destroy its 'basic structure' or essential features." 
    },
    { 
      term: "Doctrine of Judicial Review", 
      definition: "The power of the judiciary to examine the constitutionality of legislative enactments and executive orders. It is a fundamental feature of the Indian Constitution." 
    },
    { 
      term: "Doctrine of Separation of Powers", 
      definition: "The division of government responsibilities into distinct branches (Legislative, Executive, Judiciary) to prevent the concentration of power and provide for checks and balances." 
    }
  ];

  // Group maxims by first letter for the document-style UI
  const groupedMaxims = PROVIDED_MAXIMS.reduce((acc, maxim) => {
    const firstLetter = maxim.term.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(maxim);
    return acc;
  }, {} as Record<string, typeof PROVIDED_MAXIMS>);

  const sortedLetters = Object.keys(groupedMaxims).sort();

  const acts: Act[] = [
    { title: "Constitution", year: "1950", description: "The supreme law of India.", id: "const", fullName: "Constitution of India" },
    { title: "Contract Act", year: "1872", description: "Law relating to contracts in India.", id: "contract", fullName: "Indian Contract Act" },
    { title: "IPC", year: "1860", description: "The official criminal code of India.", id: "ipc", fullName: "Indian Penal Code" },
    { title: "BNS", year: "2023", description: "Replaces the Indian Penal Code.", id: "bns", fullName: "Bharatiya Nyaya Sanhita" },
    { title: "CrPC", year: "1973", description: "Main legislation on procedure for administration of substantive criminal law.", id: "crpc", fullName: "Code of Criminal Procedure" },
    { title: "BNSS", year: "2023", description: "Replaces the Code of Criminal Procedure.", id: "bnss", fullName: "Bharatiya Nagarik Suraksha Sanhita" },
    { title: "CPC", year: "1908", description: "Procedural law related to administration of civil proceedings.", id: "cpc", fullName: "Code of Civil Procedure" },
    { title: "TPA", year: "1882", description: "Regulates the transfer of property in India.", id: "tpa", fullName: "Transfer of Property Act" },
    { title: "Sale of Goods Act", year: "1930", description: "Law relating to the sale of goods.", id: "soga", fullName: "Sale of Goods Act" },
    { title: "Partnership Act", year: "1932", description: "Law relating to partnership firms.", id: "partnership", fullName: "Indian Partnership Act" },
    { title: "Torts", year: "Common Law", description: "Civil wrongs and liabilities.", id: "torts", fullName: "Law of Torts" },
    { title: "IEA", year: "1872", description: "Rules of evidence in legal proceedings.", id: "iea", fullName: "Indian Evidence Act" },
    { title: "BSA", year: "2023", description: "Replaces the Indian Evidence Act.", id: "bsa", fullName: "Bharatiya Sakshya Adhiniyam" },
    { title: "Arbitration & Conciliation Act", year: "1996", description: "Legal framework for resolving disputes through arbitration.", id: "arbitration", fullName: "Arbitration and Conciliation Act" },
    { title: "Commercial Court Act", year: "2015", description: "Specialized courts for commercial disputes.", id: "commercial", fullName: "Commercial Courts Act" },
    { title: "Consumer Protection Act", year: "2019", description: "Protects consumer rights and interests.", id: "consumer", fullName: "Consumer Protection Act" },
    { title: "RERA Act", year: "2016", description: "Real Estate Regulatory Authority Act.", id: "rera", fullName: "Real Estate (Regulation and Development) Act" },
    { title: "POSH Act", year: "2013", description: "Sexual Harassment of Women at Workplace Act.", id: "posh", fullName: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act" },
    { title: "Code on Wages", year: "2019", description: "Regulates wages and bonus payments.", id: "wages", fullName: "Code on Wages" },
    { title: "Industrial Relations Code", year: "2020", description: "Consolidates laws on trade unions and disputes.", id: "industrial", fullName: "Industrial Relations Code" },
    { title: "Code on Social Security", year: "2020", description: "Consolidates laws on social security and welfare.", id: "social", fullName: "Code on Social Security" },
    { title: "OSH Code", year: "2020", description: "Occupational Safety, Health and Working Conditions Code.", id: "osh", fullName: "Occupational Safety, Health and Working Conditions Code" },
    { title: "Income Tax Act", year: "1961", description: "Levy, administration, and collection of income tax.", id: "it", fullName: "Income-tax Act" },
    { title: "GST Act", year: "2017", description: "Goods and Services Tax Act.", id: "gst", fullName: "Central Goods and Services Tax Act" },
    // Corporate & Commercial
    { title: "LLP Act", year: "2008", description: "Limited Liability Partnership Act.", id: "llp", fullName: "Limited Liability Partnership Act" },
    { title: "IBC", year: "2016", description: "Insolvency and Bankruptcy Code.", id: "ibc", fullName: "Insolvency and Bankruptcy Code" },
    { title: "Competition Act", year: "2002", description: "Promotes competition and prevents anti-competitive practices.", id: "competition", fullName: "Competition Act" },
    { title: "SEBI Act", year: "1992", description: "Securities and Exchange Board of India Act.", id: "sebi", fullName: "Securities and Exchange Board of India Act" },
    { title: "Negotiable Instruments Act", year: "1881", description: "Law relating to promissory notes, bills of exchange and cheques.", id: "ni", fullName: "Negotiable Instruments Act" },
    { title: "Mediation Act", year: "2023", description: "Framework for mediation in India.", id: "mediation", fullName: "Mediation Act" },
    { title: "Insurance Act", year: "1938", description: "Law relating to the business of insurance.", id: "insurance", fullName: "Insurance Act" },
    // Intellectual Property
    { title: "Copyright Act", year: "1957", description: "Law relating to copyright in India.", id: "copyright", fullName: "Copyright Act" },
    { title: "Patents Act", year: "1970", description: "Law relating to patents in India.", id: "patents", fullName: "Patents Act" },
    { title: "Trade Marks Act", year: "1999", description: "Law relating to trade marks.", id: "trademarks", fullName: "Trade Marks Act" },
    { title: "GI Act", year: "1999", description: "Geographical Indications of Goods Act.", id: "gi", fullName: "Geographical Indications of Goods (Registration and Protection) Act" },
    { title: "Designs Act", year: "2000", description: "Law relating to the protection of designs.", id: "designs", fullName: "Designs Act" },
    { title: "Semiconductor Layout-Design Act", year: "2000", description: "Protection of semiconductor integrated circuits layout-designs.", id: "semiconductor", fullName: "Semiconductor Integrated Circuits Layout-Design Act" },
    // IT & Data
    { title: "IT Act", year: "2000", description: "Information Technology Act.", id: "it_act", fullName: "Information Technology Act" },
    { title: "DPDP Act", year: "2023", description: "Digital Personal Data Protection Act.", id: "dpdp", fullName: "Digital Personal Data Protection Act" },
    // Administrative & Environmental
    { title: "National Research Foundation Act", year: "2023", description: "Establishment of the Anusandhan National Research Foundation.", id: "nrf" },
    { title: "DNA Technology Regulation Bill/Act", year: "2023", description: "Regulation of the use and application of DNA technology.", id: "dna_tech" },
    { title: "Ozone Depleting Substances Rules", year: "Various", description: "Regulation and control of ozone depleting substances.", id: "ozone_rules" },
    { title: "Biomedical Waste Management Rules", year: "2016", description: "Management and handling of biomedical waste.", id: "biomedical_waste" },
    { title: "E-Waste Management Rules", year: "2022", description: "Management and handling of e-waste.", id: "e_waste" },
    { title: "Plastic Waste Management Rules", year: "2016", description: "Management and handling of plastic waste.", id: "plastic_waste" },
    { title: "CRZ Notification/Act", year: "Various", description: "Coastal Regulation Zone management.", id: "crz" },
    { title: "Forest Conservation Amendment Act", year: "2023", description: "Amendments to the Forest (Conservation) Act.", id: "forest_amendment" },
    { title: "Administrative Tribunals Act", year: "1985", description: "Establishment of administrative tribunals for adjudication of disputes relating to recruitment and conditions of service.", id: "admin_tribunals" },
    { title: "All India Services Act", year: "1951", description: "Regulation of recruitment and conditions of service of persons appointed to All-India Services.", id: "ais_act" },
    { title: "Public Servants (Inquiries) Act", year: "1850", description: "Regulating inquiries into the behaviour of public servants.", id: "public_servants_inquiries" },
    { title: "Prevention of Insults to National Honour Act", year: "1971", description: "Prevention of insults to national symbols.", id: "national_honour" },
    { title: "Emblems and Names Act", year: "1950", description: "Prevention of improper use of certain emblems and names for professional and commercial purposes.", id: "emblems_names" },
    { title: "Flag Code of India", year: "2002", description: "Rules and conventions for the display of the National Flag.", id: "flag_code" },
    { title: "Census Act", year: "1948", description: "Law relating to the taking of census in India.", id: "census" },
    { title: "Collection of Statistics Act", year: "2008", description: "Facilitating the collection of statistics on economic, demographic, social, scientific and environmental aspects.", id: "statistics_collection" },
    { title: "Delimitation Act", year: "2002", description: "Readjustment of the allocation of seats in the House of the People and Legislative Assemblies.", id: "delimitation" },
    { title: "Representation of the People Act", year: "1950/51", description: "Law relating to the conduct of elections and qualifications/disqualifications of members.", id: "rpa" },
    { title: "RTI Act", year: "2005", description: "Right to Information Act.", id: "rti" },
    { title: "Lokpal & Lokayuktas Act", year: "2013", description: "Anti-corruption ombudsman act.", id: "lokpal" },
    { title: "Environment Protection Act", year: "1986", description: "Umbrella legislation for environmental protection.", id: "environment" },
    { title: "Water Act", year: "1974", description: "Prevention and control of water pollution.", id: "water" },
    { title: "Air Act", year: "1981", description: "Prevention and control of air pollution.", id: "air" },
    { title: "NGT Act", year: "2010", description: "National Green Tribunal Act.", id: "ngt" },
    { title: "Biological Diversity Act", year: "2002", description: "Preservation of biological diversity in India.", id: "biodiversity" },
    { title: "Wildlife Protection Act", year: "1972", description: "Protection of wild animals, birds and plants.", id: "wildlife" },
    { title: "Forest Conservation Act", year: "1980", description: "Conservation of forests and matters connected therewith.", id: "forest" },
    { title: "Public Liability Insurance Act", year: "1991", description: "Insurance for providing immediate relief to persons affected by accidents while handling hazardous substances.", id: "public_liability" },
    // Labour
    { title: "Beedi and Cigar Workers Act", year: "1966", description: "Conditions of employment of beedi and cigar workers.", id: "beedi_workers" },
    { title: "BOCW Act", year: "1996", description: "Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Act.", id: "bocw" },
    { title: "Cine-Workers Act", year: "1981", description: "Regulation of employment of cine-workers and cinema theatre workers.", id: "cine_workers" },
    { title: "Dock Workers Act", year: "1986", description: "Safety, health and welfare of dock workers.", id: "dock_workers" },
    { title: "Inter-State Migrant Workmen Act", year: "1979", description: "Regulation of employment and conditions of service of inter-state migrant workmen.", id: "migrant_workmen" },
    { title: "Mines Act", year: "1952", description: "Law relating to the regulation of labour and safety in mines.", id: "mines" },
    { title: "Plantations Labour Act", year: "1951", description: "Welfare of labour in plantations.", id: "plantations_labour" },
    { title: "Sales Promotion Employees Act", year: "1976", description: "Conditions of service of sales promotion employees.", id: "sales_promotion" },
    { title: "Working Journalists Act", year: "1955", description: "Conditions of service of working journalists and other newspaper employees.", id: "working_journalists" },
    { title: "Unorganised Workers' Social Security Act", year: "2008", description: "Social security and welfare of unorganised workers.", id: "unorganised_workers" },
    { title: "Industrial Disputes Act", year: "1947", description: "Investigation and settlement of industrial disputes.", id: "industrial_disputes" },
    { title: "Trade Unions Act", year: "1926", description: "Registration and protection of trade unions.", id: "trade_unions" },
    { title: "Factories Act", year: "1948", description: "Health, safety and welfare of workers in factories.", id: "factories" },
    { title: "Minimum Wages Act", year: "1948", description: "Fixing minimum rates of wages in certain employments.", id: "min_wages" },
    { title: "Payment of Wages Act", year: "1936", description: "Regulates the payment of wages to certain classes of persons.", id: "payment_wages" },
    { title: "Employees' Compensation Act", year: "1923", description: "Payment of compensation to employees for injury by accident.", id: "emp_comp" },
    { title: "Maternity Benefit Act", year: "1961", description: "Regulates the employment of women in certain establishments for certain periods before and after child-birth.", id: "maternity" },
    { title: "Payment of Gratuity Act", year: "1972", description: "Scheme for the payment of gratuity to employees.", id: "gratuity" },
    { title: "Child Labour Act", year: "1986", description: "Prohibition and regulation of child labour.", id: "child_labour" },
    { title: "POCSO Act", year: "2012", description: "Protection of Children from Sexual Offences Act.", id: "pocso" },
    { title: "Child Rights Protection Act", year: "2005", description: "Commissions for Protection of Child Rights Act.", id: "child_rights" },
    { title: "RTE Act", year: "2009", description: "Right of Children to Free and Compulsory Education Act.", id: "rte" },
    { title: "Young Persons (Harmful Publications) Act", year: "1956", description: "Prevention of dissemination of certain publications harmful to young persons.", id: "young_persons" },
    { title: "Hindu Minority and Guardianship Act", year: "1956", description: "Law relating to minority and guardianship among Hindus.", id: "hmga" },
    { title: "Orphanages and Charitable Homes Act", year: "1960", description: "Supervision and control of orphanages and other charitable homes.", id: "orphanages" },
    // Family
    { title: "Religious Endowments Act", year: "1863", description: "Law relating to religious endowments.", id: "religious_endowments" },
    { title: "Charitable and Religious Trusts Act", year: "1920", description: "Law relating to charitable and religious trusts.", id: "charitable_trusts" },
    { title: "Kazis Act", year: "1880", description: "Law relating to the office of Kazis.", id: "kazis" },
    { title: "Anand Marriage Act", year: "1909", description: "Law relating to the validation of marriages among the Sikhs.", id: "anand_marriage" },
    { title: "Arya Marriage Validation Act", year: "1937", description: "Law relating to the validation of marriages among Arya Samajists.", id: "arya_marriage" },
    { title: "Caste Disabilities Removal Act", year: "1850", description: "Law relating to the removal of disabilities due to change of religion or loss of caste.", id: "caste_disabilities" },
    { title: "Hindu Marriage Act", year: "1955", description: "Law relating to marriage among Hindus.", id: "hma" },
    { title: "Hindu Succession Act", year: "1956", description: "Law relating to intestate succession among Hindus.", id: "hsa" },
    { title: "Hindu Adoption & Maintenance Act", year: "1956", description: "Law relating to adoptions and maintenance among Hindus.", id: "hama" },
    { title: "Special Marriage Act", year: "1954", description: "Special form of marriage in certain cases.", id: "sma" },
    { title: "Guardians & Wards Act", year: "1890", description: "Law relating to guardians and wards.", id: "guardians" },
    { title: "Indian Succession Act", year: "1925", description: "Law relating to testamentary and intestate succession.", id: "indian_succession" },
    { title: "Senior Citizens Act", year: "2007", description: "Maintenance and Welfare of Parents and Senior Citizens Act.", id: "senior_citizens" },
    { title: "Dowry Prohibition Act", year: "1961", description: "Prohibits the giving or taking of dowry.", id: "dowry" },
    { title: "Commission of Sati Act", year: "1987", description: "Prevention of the commission of sati and its glorification.", id: "sati" },
    { title: "MTP Act", year: "1971", description: "Medical Termination of Pregnancy Act.", id: "mtp" },
    { title: "PCPNDT Act", year: "1994", description: "Pre-conception and Pre-natal Diagnostic Techniques Act.", id: "pcpndt" },
    { title: "Triple Talaq Act", year: "2019", description: "Muslim Women (Protection of Rights on Marriage) Act.", id: "triple_talaq" },
    { title: "Dissolution of Muslim Marriages Act", year: "1939", description: "Law relating to dissolution of Muslim marriages.", id: "muslim_marriage_dissolution" },
    // Professional & Others
    { title: "Advocates Act", year: "1961", description: "Law relating to legal practitioners.", id: "advocates" },
    { title: "Contempt of Courts Act", year: "1971", description: "Powers of certain courts to punish contempts.", id: "contempt" },
    { title: "Motor Vehicles Act", year: "1988", description: "Law relating to motor vehicles.", id: "mva" },
    { title: "Legal Services Authorities Act", year: "1987", description: "Constitutes legal services authorities to provide free and competent legal services.", id: "legal_services" },
    // Criminal & Special Laws
    { title: "WMD Act", year: "2005", description: "Weapons of Mass Destruction and their Delivery Systems (Prohibition of Unlawful Activities) Act.", id: "wmd" },
    { title: "Arms Act", year: "1959", description: "Law relating to arms and ammunition.", id: "arms" },
    { title: "NDPS Act", year: "1985", description: "Narcotic Drugs and Psychotropic Substances Act.", id: "ndps" },
    { title: "Prevention of Corruption Act", year: "1988", description: "Law relating to the prevention of corruption.", id: "corruption" },
    { title: "PMLA", year: "2002", description: "Prevention of Money Laundering Act.", id: "pmla" },
    { title: "UAPA", year: "1967", description: "Unlawful Activities (Prevention) Act.", id: "uapa" },
    { title: "Immoral Traffic (Prevention) Act", year: "1956", description: "Law relating to the prevention of immoral traffic.", id: "immoral_traffic" },
    { title: "Indecent Representation of Women Act", year: "1986", description: "Prohibition of indecent representation of women.", id: "indecent_rep" },
    { title: "Juvenile Justice Act", year: "2015", description: "Care and protection of children.", id: "jj_act" },
    { title: "Probation of Offenders Act", year: "1958", description: "Law relating to the probation of offenders.", id: "probation" },
    { title: "Prisoners Act", year: "1900", description: "Law relating to prisoners.", id: "prisoners" },
    // Banking & Finance
    { title: "Bankers' Books Evidence Act", year: "1891", description: "Law relating to the evidence of bankers' books.", id: "bankers_evidence" },
    { title: "Credit Information Companies Act", year: "2005", description: "Regulation of credit information companies.", id: "credit_info" },
    { title: "DICGC Act", year: "1961", description: "Deposit Insurance and Credit Guarantee Corporation Act.", id: "dicgc" },
    { title: "EXIM Bank Act", year: "1981", description: "Export-Import Bank of India Act.", id: "exim_bank" },
    { title: "National Housing Bank Act", year: "1987", description: "Establishment of the National Housing Bank.", id: "nhb" },
    { title: "Payment and Settlement Systems Act", year: "2007", description: "Regulation and supervision of payment systems in India.", id: "payment_settlement" },
    { title: "State Bank of India Act", year: "1955", description: "Constitution of the State Bank of India.", id: "sbi_act" },
    { title: "SIDBI Act", year: "1989", description: "Small Industries Development Bank of India Act.", id: "sidbi" },
    { title: "Factoring Regulation Act", year: "2011", description: "Regulation of assignment of receivables.", id: "factoring_reg" },
    { title: "Prize Chits and Money Circulation Schemes Act", year: "1978", description: "Banning of prize chits and money circulation schemes.", id: "prize_chits" },
    { title: "Banking Regulation Act", year: "1949", description: "Regulation of banking companies in India.", id: "banking_reg" },
    { title: "RBI Act", year: "1934", description: "Reserve Bank of India Act.", id: "rbi" },
    { title: "SARFAESI Act", year: "2002", description: "Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act.", id: "sarfaesi" },
    { title: "DRT Act", year: "1993", description: "Recovery of Debts and Bankruptcy Act.", id: "drt" },
    { title: "FEMA", year: "1999", description: "Foreign Exchange Management Act.", id: "fema" },
    { title: "MSMED Act", year: "2006", description: "Micro, Small and Medium Enterprises Development Act.", id: "msmed" },
    { title: "Chit Funds Act", year: "1982", description: "Law relating to chit funds.", id: "chit_funds" },
    { title: "Benami Transactions Act", year: "1988", description: "Prohibition of Benami Transactions Act.", id: "benami" },
    { title: "Black Money Act", year: "2015", description: "Undisclosed Foreign Income and Assets and Imposition of Tax Act.", id: "black_money" },
    { title: "Banking Laws (Amendment) Act", year: "2025", description: "Amendments to various banking laws for modernization.", id: "banking_laws_2025" },
    { title: "Limited Liability Partnership Act", year: "2008", description: "Law relating to limited liability partnerships.", id: "llp_act" },
    { title: "Competition Act", year: "2002", description: "Law relating to the promotion of competition.", id: "competition_act" },
    { title: "Fugitive Economic Offenders Act", year: "2018", description: "Measures to deter fugitive economic offenders from evading the process of law.", id: "fugitive_offenders" },
    { title: "Smugglers and Foreign Exchange Manipulators Act", year: "1976", description: "Forfeiture of illegally acquired property.", id: "safema" },
    { title: "COFEPOSA", year: "1974", description: "Conservation of Foreign Exchange and Prevention of Smuggling Activities Act.", id: "cofeposa" },
    { title: "Customs Tariff Act", year: "1975", description: "Law relating to customs duties and tariffs.", id: "customs_tariff" },
    // Procedural & General
    { title: "Oaths Act", year: "1969", description: "Law relating to judicial oaths and affirmations.", id: "oaths" },
    { title: "Notaries Act", year: "1952", description: "Law relating to notaries.", id: "notaries" },
    { title: "Registration Act", year: "1908", description: "Law relating to the registration of documents.", id: "registration" },
    { title: "Indian Stamp Act", year: "1899", description: "Law relating to stamps.", id: "stamp" },
    { title: "Court-Fees Act", year: "1870", description: "Law relating to fees in courts.", id: "court_fees" },
    { title: "Suits Valuation Act", year: "1887", description: "Law relating to the valuation of suits.", id: "suits_valuation" },
    { title: "General Clauses Act", year: "1897", description: "Interpretation of central acts and regulations (The 'Mother of all Acts').", id: "general_clauses" },
    { title: "Guardians and Wards Act", year: "1890", description: "Law relating to guardians and wards.", id: "guardians_wards" },
    { title: "Interest Act", year: "1978", description: "Law relating to the allowance of interest in certain cases.", id: "interest_act" },
    { title: "Public Accountants' Default Act", year: "1850", description: "Law for avoiding loss by the default of Public Accountants.", id: "public_accountants" },
    { title: "Family Courts Act", year: "1984", description: "Establishment of family courts.", id: "family_courts" },
    { title: "Delhi Judicial Service Rules", year: "1970", description: "Rules governing the Delhi Judicial Service (Updated 2026).", id: "delhi_judicial_rules" },
    // Social Welfare & Human Rights
    { title: "Protection of Human Rights Act", year: "1993", description: "Constitution of National and State Human Rights Commissions.", id: "human_rights" },
    { title: "Domestic Violence Act", year: "2005", description: "Protection of Women from Domestic Violence Act.", id: "domestic_violence" },
    { title: "Prohibition of Child Marriage Act", year: "2006", description: "Law relating to the prohibition of child marriage.", id: "child_marriage" },
    { title: "SC/ST Act", year: "1989", description: "Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act.", id: "sc_st" },
    { title: "Waqf Act", year: "1995", description: "Administration of waqfs.", id: "waqf" },
    { title: "Mental Healthcare Act", year: "2017", description: "Mental healthcare and services for persons with mental illness.", id: "mental_health" },
    { title: "Rights of Persons with Disabilities Act", year: "2016", description: "Rights and entitlements of persons with disabilities.", id: "disabilities" },
    { title: "Transgender Persons Act", year: "2019", description: "Protection of Rights of Transgender Persons.", id: "transgender" },
    { title: "National Commission for Women Act", year: "1990", description: "Constitution of the National Commission for Women.", id: "ncw" },
    { title: "National Commission for Minorities Act", year: "1992", description: "Constitution of the National Commission for Minorities.", id: "ncm" },
    { title: "Protection of Civil Rights Act", year: "1955", description: "Prescribes punishment for the preaching and practice of untouchability.", id: "civil_rights" },
    { title: "Bonded Labour System (Abolition) Act", year: "1976", description: "Abolition of bonded labour system.", id: "bonded_labour" },
    { title: "Manual Scavengers Rehabilitation Act", year: "2013", description: "Prohibition of Employment as Manual Scavengers and their Rehabilitation Act.", id: "manual_scavengers" },
    { title: "NCBC Act", year: "1993", description: "National Commission for Backward Classes Act.", id: "ncbc" },
    { title: "Maintenance of Parents Act", year: "2007", description: "Maintenance and Welfare of Parents and Senior Citizens Act.", id: "maintenance_parents" },
    { title: "Waqf (Amendment) Act", year: "2025", description: "Amendments to the administration of waqfs.", id: "waqf_amendment" },
    { title: "Mussalman Wakf (Repeal) Act", year: "2025", description: "Repeal of the Mussalman Wakf Act.", id: "wakf_repeal" },
    { title: "Citizenship Act", year: "1955", description: "Law relating to Indian citizenship (With latest CAA Rules).", id: "citizenship" },
    // Property & Land
    { title: "LARR Act", year: "2013", description: "Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act.", id: "larr" },
    { title: "Easements Act", year: "1882", description: "Law relating to easements and licenses.", id: "easements" },
    { title: "Public Premises Act", year: "1971", description: "Eviction of Unauthorised Occupants from Public Premises.", id: "public_premises" },
    { title: "Slum Areas Act", year: "1956", description: "Improvement and clearance of slum areas.", id: "slum_areas" },
    { title: "M.P. Accommodation Control Act", year: "1961", description: "Regulation of letting and rent in Madhya Pradesh.", id: "mp_accommodation" },
    { title: "Rajasthan Rent Control Act", year: "2001", description: "Regulation of rent and eviction in Rajasthan.", id: "rajasthan_rent" },
    { title: "UP Urban Buildings Act", year: "1972", description: "Regulation of letting, rent and eviction in Uttar Pradesh.", id: "up_rent" },
    { title: "Maharashtra Rent Control Act", year: "1999", description: "Unified law for rent control in Maharashtra.", id: "maharashtra_rent" },
    { title: "Haryana Urban Rent Control Act", year: "1973", description: "Control of rent and eviction in Haryana.", id: "haryana_rent" },
    // Media & Emergency
    { title: "Cinematograph Act", year: "1952", description: "Certification of cinematograph films for exhibition.", id: "cinematograph" },
    { title: "Prasar Bharati Act", year: "1990", description: "Establishment of the Broadcasting Corporation of India.", id: "prasar_bharati" },
    { title: "Disaster Management (Amendment) Act", year: "2025", description: "Updated framework for effective management of disasters.", id: "disaster_mgmt_2025" },
    { title: "Epidemic Diseases Act", year: "1897", description: "Prevention of the spread of dangerous epidemic diseases.", id: "epidemic" },
    { title: "IT Rules", year: "2021", description: "Intermediary Guidelines and Digital Media Ethics Code (Updated 2025).", id: "it_rules" },
    { title: "DPDP Act", year: "2023", description: "Digital Personal Data Protection Act (With 2025/26 Rules).", id: "dpdp_act" },
    { title: "Nursing & Midwifery Commission Act", year: "2023", description: "National Nursing and Midwifery Commission Act.", id: "nursing_commission" },
    { title: "National Dental Commission Act", year: "2023", description: "Regulation of the dental profession.", id: "dental_commission" },
    { title: "ART Regulation Act", year: "2021", description: "Assisted Reproductive Technology (Regulation) Act.", id: "art_regulation" },
    { title: "Surrogacy Regulation Act", year: "2021", description: "Regulation of surrogacy and surrogacy clinics.", id: "surrogacy_regulation" },
    // Public Health & Safety
    { title: "Food Safety and Standards Act", year: "2006", description: "Law relating to food safety and standards.", id: "fssa" },
    { title: "Drugs and Cosmetics Act", year: "1940", description: "Law relating to drugs and cosmetics.", id: "drugs_cosmetics" },
    { title: "COTPA Act", year: "2003", description: "Cigarettes and Other Tobacco Products Act.", id: "cotpa" },
    { title: "Poisons Act", year: "1919", description: "Law relating to the importation, possession and sale of poisons.", id: "poisons" },
    // Agriculture & Food
    { title: "Seeds Act", year: "1966", description: "Regulating the quality of certain seeds for sale.", id: "seeds" },
    { title: "Plant Varieties Protection Act", year: "2001", description: "Protection of Plant Varieties and Farmers' Rights Act.", id: "plant_varieties" },
    { title: "Essential Commodities Act", year: "1955", description: "Control of the production, supply and distribution of essential commodities.", id: "essential_commodities" },
    { title: "Prevention of Blackmarketing Act", year: "1980", description: "Prevention of Blackmarketing and Maintenance of Supplies of Essential Commodities Act.", id: "blackmarketing" },
    { title: "APMC Model Acts", year: "Various", description: "Agricultural Produce Marketing Committee model legislation.", id: "apmc" },
    { title: "Warehousing Act", year: "2007", description: "Warehousing (Development and Regulation) Act.", id: "warehousing" },
    { title: "Prevention of Cruelty to Animals Act", year: "1960", description: "Prevention of the infliction of unnecessary pain or suffering on animals.", id: "animal_cruelty" },
    { title: "Livestock Importation Act", year: "1898", description: "Regulation of the importation of livestock.", id: "livestock_import" },
    { title: "Fertilizer Control Order/Act", year: "Various", description: "Regulation of fertilizer quality and distribution.", id: "fertilizer_control" },
    { title: "National Food Security Act", year: "2013", description: "Law relating to food and nutritional security.", id: "food_security" },
    // Infrastructure & Transport
    { title: "Admiralty Act", year: "2017", description: "Jurisdiction and settlement of maritime claims.", id: "admiralty" },
    { title: "Coast Guard Act", year: "1978", description: "Constitution and regulation of the Coast Guard.", id: "coast_guard" },
    { title: "Carriage by Road Act", year: "2007", description: "Regulation of common carriers by road.", id: "carriage_road" },
    { title: "Multimodal Transportation Act", year: "1993", description: "Regulation of multimodal transportation of goods.", id: "multimodal_transport" },
    { title: "Aircraft Act", year: "1934", description: "Control of the manufacture, possession, use, operation, sale, import and export of aircraft.", id: "aircraft" },
    { title: "Aircraft Security Rules", year: "2023", description: "Security measures for civil aviation.", id: "aircraft_security" },
    { title: "International Airports Authority Act", year: "1971", description: "Establishment of the International Airports Authority of India.", id: "intl_airports" },
    { title: "Railways Act", year: "1989", description: "Law relating to railways in India.", id: "railways" },
    { title: "Metro Railways Act", year: "2002", description: "Operation and maintenance of metro railways.", id: "metro_railways" },
    { title: "National Highways Act", year: "1956", description: "Law relating to national highways.", id: "highways" },
    { title: "AERA Act", year: "2008", description: "Airports Economic Regulatory Authority of India Act.", id: "aera" },
    { title: "Inland Vessels Act", year: "2021", description: "Law relating to inland vessels.", id: "inland_vessels" },
    { title: "Carriage by Air Act", year: "1972", description: "Law relating to carriage by air.", id: "carriage_air" },
    { title: "Merchant Shipping Act", year: "1958", description: "Law relating to merchant shipping.", id: "merchant_shipping" },
    { title: "Merchant Shipping Bill", year: "2025", description: "Finalized modernization of merchant shipping laws.", id: "merchant_shipping_bill" },
    { title: "Marine Insurance Act", year: "1963", description: "Law relating to marine insurance.", id: "marine_insurance" },
    { title: "Maritime Anti-Piracy Act", year: "2022", description: "Measures to combat piracy at sea.", id: "maritime_anti_piracy" },
    { title: "Carriage of Goods by Sea Act", year: "2025", description: "Updated framework for modern maritime logistics.", id: "carriage_goods_sea" },
    { title: "Bills of Lading Act", year: "2025", description: "Digital transition update for bills of lading.", id: "bills_lading" },
    { title: "Coastal Aquaculture Authority Act", year: "2023", description: "Regulation of coastal aquaculture (Amendment).", id: "coastal_aquaculture" },
    { title: "Coastal Shipping Act", year: "2025", description: "Regulation and promotion of coastal shipping.", id: "coastal_shipping" },
    { title: "Aircraft Objects Protection Act", year: "2025", description: "Protection of interests in aircraft objects.", id: "aircraft_objects" },
    { title: "Bharatiya Vayuyan Adhiniyam", year: "2024", description: "Modernized law for civil aviation (Replaced Aircraft Act, 1934).", id: "vayuyan_adhiniyam" },
    // Energy & Resources
    { title: "Coal Mines Special Provisions Act", year: "2015", description: "Allocation of coal mines and vesting of right, title and interest in coal mines.", id: "coal_mines" },
    { title: "MMDR Act", year: "1957", description: "Mines and Minerals (Development and Regulation) Act.", id: "mmdr" },
    { title: "PNGRB Act", year: "2006", description: "Petroleum and Natural Gas Regulatory Board Act.", id: "pngrb" },
    { title: "SECI Act/Rules", year: "2026", description: "Solar Energy Corporation of India governance.", id: "seci" },
    { title: "Electricity Act", year: "2003", description: "Law relating to generation, transmission, distribution, trading and use of electricity.", id: "electricity" },
    { title: "Offshore Areas Mineral Act", year: "2002", description: "Development and regulation of mineral resources in offshore areas.", id: "offshore_mineral" },
    { title: "Dam Safety Act", year: "2021", description: "Surveillance, inspection, operation and maintenance of specified dams.", id: "dam_safety" },
    { title: "River Boards Act", year: "1956", description: "Establishment of River Boards for the regulation and development of inter-State rivers.", id: "river_boards" },
    { title: "Petroleum Act", year: "1934", description: "Law relating to the import, transport, storage, production, refining and blending of petroleum.", id: "petroleum" },
    { title: "Oilfields Act", year: "1948", description: "Regulation and development of oilfields and mineral oil resources.", id: "oilfields" },
    { title: "Atomic Energy Act", year: "1962", description: "Development, control and use of atomic energy.", id: "atomic_energy" },
    // National Security & Investigation
    { title: "National Security Act", year: "1980", description: "Law relating to preventive detention in certain cases.", id: "nsa" },
    { title: "AFSPA", year: "1958", description: "Armed Forces (Special Powers) Act.", id: "afspa" },
    { title: "NIA Act", year: "2008", description: "National Investigation Agency Act.", id: "nia" },
    { title: "Official Secrets Act", year: "1923", description: "Law relating to official secrets.", id: "official_secrets" },
    { title: "CVC Act", year: "2003", description: "Central Vigilance Commission Act.", id: "cvc" },
    { title: "DSPE Act", year: "1946", description: "Delhi Special Police Establishment Act.", id: "dspe" },
    { title: "BSF Act", year: "1968", description: "Border Security Force Act.", id: "bsf" },
    { title: "Extradition Act", year: "1962", description: "Law relating to the extradition of fugitive criminals.", id: "extradition" },
    { title: "Passports Act", year: "1967", description: "Law relating to the issue of passports and travel documents.", id: "passports" },
    { title: "National Anti-Doping (Amendment) Act", year: "2025", description: "Updated measures against doping in sports.", id: "anti_doping_2025" },
    { title: "FCRA", year: "2010", description: "Foreign Contribution (Regulation) Act.", id: "fcra" },
    { title: "Inter-Services Organisations Act", year: "2023", description: "Command, control and discipline in inter-services organisations.", id: "inter_services" },
    // Media, Sports & Education
    { title: "Actuaries Act", year: "2006", description: "Regulation and development of the profession of actuaries.", id: "actuaries" },
    { title: "Architects Act", year: "1972", description: "Registration of architects and matters connected therewith.", id: "architects" },
    { title: "Chartered Accountants Act", year: "1949", description: "Regulation of the profession of chartered accountants.", id: "ca_act" },
    { title: "Cost and Works Accountants Act", year: "1959", description: "Regulation of the profession of cost and works accountants.", id: "cwa_act" },
    { title: "Company Secretaries Act", year: "1980", description: "Regulation of the profession of company secretaries.", id: "cs_act" },
    { title: "Dentists Act", year: "1948", description: "Regulation of the profession of dentistry.", id: "dentists" },
    { title: "Indian Medical Council Act", year: "1956", description: "Constitution of the Medical Council of India.", id: "imc_act" },
    { title: "Pharmacy Act", year: "1948", description: "Regulation of the profession of pharmacy.", id: "pharmacy" },
    { title: "Nursing Council Act", year: "1947", description: "Constitution of the Indian Nursing Council.", id: "nursing_council" },
    { title: "Rehabilitation Council of India Act", year: "1992", description: "Constitution of the Rehabilitation Council of India.", id: "rehab_council" },
    { title: "Cable TV Networks Act", year: "1995", description: "Regulation of cable television networks.", id: "cable_tv" },
    { title: "Press & Registration of Periodicals Act", year: "2023", description: "Registration of periodicals and newspapers.", id: "press_reg" },
    { title: "National Sports Governance Act", year: "2025", description: "Governance and regulation of sports in India.", id: "sports_governance" },
    { title: "UGC Act", year: "1956", description: "University Grants Commission Act.", id: "ugc" },
    { title: "National Medical Commission Act", year: "2019", description: "Regulation of medical education and profession.", id: "nmc" },
    { title: "Bar Council of India Rules", year: "Various", description: "Rules governing the legal profession and education.", id: "bci_rules" },
    { title: "Ancient Monuments Act", year: "1958", description: "Ancient Monuments and Archaeological Sites and Remains Act.", id: "ancient_monuments" },
    { title: "Tribhuvan Sahkari University Act", year: "2025", description: "Establishment of the Tribhuvan Sahkari University.", id: "tribhuvan_univ" },
    { title: "Geographical Indications Act", year: "1999", description: "Registration and protection of geographical indications of goods.", id: "gi_act" },
    { title: "Biological Diversity Act", year: "2002", description: "Conservation of biological diversity (Updated 2023).", id: "bio_diversity" },
    { title: "Public Records Act", year: "1993", description: "Regulation of public records.", id: "public_records" },
    { title: "Delivery of Books Act", year: "1954", description: "Delivery of Books and Newspapers (Public Libraries) Act.", id: "delivery_books" },
    // Miscellaneous
    { title: "Dramatic Performances Act", year: "1876", description: "Law relating to dramatic performances.", id: "dramatic_performances" },
    { title: "Treasure Trove Act", year: "1878", description: "Law relating to treasure-trove.", id: "treasure_trove" },
    { title: "Sarais Act", year: "1867", description: "Law relating to the regulation of Sarais.", id: "sarais" },
    { title: "Official Languages Act", year: "1963", description: "Law relating to the languages which may be used for the official purposes of the Union.", id: "official_languages" },
    { title: "Antiquities and Art Treasures Act", year: "1972", description: "Regulation of export trade in antiquities and art treasures.", id: "antiquities" },
    { title: "BIS Act", year: "2016", description: "Bureau of Indian Standards Act.", id: "bis" },
    { title: "Energy Conservation Act", year: "2001", description: "Law relating to the efficient use of energy and its conservation.", id: "energy_conservation" },
    { title: "Major Port Authorities Act", year: "2021", description: "Regulation, operation and planning of major ports in India.", id: "major_ports" },
    { title: "National Trust Act", year: "1999", description: "National Trust for Welfare of Persons with Autism, Cerebral Palsy, Mental Retardation and Multiple Disabilities Act.", id: "national_trust" },
    { title: "SEZ Act", year: "2005", description: "Special Economic Zones Act.", id: "sez" },
    { title: "Street Vendors Act", year: "2014", description: "Protection of livelihood and regulation of street vending.", id: "street_vendors" },
    { title: "Boilers Act", year: "2025", description: "Regulation of boilers (Replaced the 1923 Act).", id: "boilers_2025" },
    { title: "Presidential Elections Act", year: "1952", description: "Presidential and Vice-Presidential Elections Act.", id: "presidential_elections" },
    { title: "Commissions of Inquiry Act", year: "1952", description: "Law relating to commissions of inquiry.", id: "commissions_inquiry" },
    { title: "Indian Post Office Act", year: "1898", description: "Law relating to the Post Office in India.", id: "post_office" },
    { title: "Cattle-Trespass Act", year: "1871", description: "Law relating to cattle-trespass.", id: "cattle_trespass" },
    // Procedural & General (Additional)
    { title: "Limitation Act", year: "1963", description: "Law relating to the limitation of suits and other proceedings.", id: "limitation" },
    { title: "Specific Relief Act", year: "1963", description: "Law relating to specific relief.", id: "specific_relief" },
    // Additional 100 Acts
    { title: "Cantonments Act", year: "2006", description: "Administration of cantonments.", id: "cantonments" },
    { title: "Disaster Management Act", year: "2005", description: "Effective management of disasters.", id: "disaster_mgmt" },
    { title: "Enemy Property Act", year: "1968", description: "Vesting and preservation of enemy property.", id: "enemy_property" },
    { title: "Places of Worship Act", year: "1991", description: "Prohibits conversion of places of worship.", id: "places_worship" },
    { title: "Prevention of Damage to Public Property Act", year: "1984", description: "Prevention of damage to public property.", id: "public_property_damage" },
    { title: "Whistle Blowers Protection Act", year: "2014", description: "Protection of persons making public interest disclosures.", id: "whistle_blowers" },
    { title: "Official Trustees Act", year: "1913", description: "Law relating to Official Trustees.", id: "official_trustees" },
    { title: "Administrators-General Act", year: "1963", description: "Law relating to Administrators-General.", id: "administrators_general" },
    { title: "Foreigners Act", year: "1946", description: "Powers to deal with foreigners.", id: "foreigners" },
    { title: "Passport (Entry into India) Act", year: "1920", description: "Power to require passports for entry into India.", id: "passport_entry" },
    { title: "APEDA Act", year: "1985", description: "Agricultural and Processed Food Products Export Development Authority.", id: "apeda" },
    { title: "Coconut Development Board Act", year: "1979", description: "Development of the coconut industry.", id: "coconut_board" },
    { title: "Coffee Act", year: "1942", description: "Development of the coffee industry.", id: "coffee_act" },
    { title: "Coir Industry Act", year: "1953", description: "Control and development of the coir industry.", id: "coir_industry" },
    { title: "Insecticides Act", year: "1968", description: "Regulation of import, manufacture, sale, transport, distribution and use of insecticides.", id: "insecticides" },
    { title: "MPEDA Act", year: "1972", description: "Marine Products Export Development Authority.", id: "mpeda" },
    { title: "NDDB Act", year: "1987", description: "National Dairy Development Board.", id: "nddb" },
    { title: "Rubber Act", year: "1947", description: "Development of the rubber industry.", id: "rubber_act" },
    { title: "Spices Board Act", year: "1986", description: "Constitution of the Spices Board.", id: "spices_board" },
    { title: "Tea Act", year: "1953", description: "Control of the tea industry.", id: "tea_act" },
    { title: "Tobacco Board Act", year: "1975", description: "Development of the tobacco industry.", id: "tobacco_board" },
    { title: "Coinage Act", year: "2011", description: "Consolidation of laws relating to coinage.", id: "coinage" },
    { title: "Government Securities Act", year: "2006", description: "Law relating to Government securities.", id: "g_sec" },
    { title: "High Denomination Bank Notes Act", year: "1978", description: "Demonetisation of high denomination bank notes.", id: "demonetisation" },
    { title: "IFCI Act", year: "1993", description: "Transfer of undertaking of Industrial Finance Corporation.", id: "ifci" },
    { title: "RDBFI Act", year: "1993", description: "Recovery of Debts Due to Banks and Financial Institutions.", id: "rdbfi" },
    { title: "State Financial Corporations Act", year: "1951", description: "Establishment of State Financial Corporations.", id: "sfc" },
    { title: "UTI Act", year: "2002", description: "Transfer of undertaking of Unit Trust of India.", id: "uti" },
    { title: "Banning of Unregulated Deposit Schemes Act", year: "2019", description: "Banning of unregulated deposit schemes.", id: "buds" },
    { title: "Apprentices Act", year: "1961", description: "Regulation and control of training of apprentices.", id: "apprentices" },
    { title: "Companies Act", year: "2013", description: "Law relating to companies.", id: "companies_2013" },
    { title: "Essential Services Maintenance Act", year: "1981", description: "Maintenance of certain essential services.", id: "esma" },
    { title: "IDRA Act", year: "1951", description: "Industries (Development and Regulation) Act.", id: "idra" },
    { title: "MSME Development Act", year: "2006", description: "Promotion and development of MSMEs.", id: "msme" },
    { title: "National Jute Board Act", year: "2008", description: "Development of the cultivation, manufacture and production of jute.", id: "jute_board" },
    { title: "Sugar Cess Act", year: "1982", description: "Imposition of cess on sugar.", id: "sugar_cess" },
    { title: "AICTE Act", year: "1987", description: "All India Council for Technical Education.", id: "aicte" },
    { title: "BBAU Act", year: "1994", description: "Babasaheb Bhimrao Ambedkar University.", id: "bbau" },
    { title: "BHU Act", year: "1915", description: "Banaras Hindu University.", id: "bhu" },
    { title: "Central Universities Act", year: "2009", description: "Establishment of Central Universities.", id: "central_universities" },
    { title: "IGNOU Act", year: "1985", description: "Indira Gandhi National Open University.", id: "ignou" },
    { title: "IIT Act", year: "1961", description: "Institutes of Technology.", id: "iit_act" },
    { title: "JNU Act", year: "1966", description: "Jawaharlal Nehru University.", id: "jnu" },
    { title: "NID Act", year: "2014", description: "National Institute of Design.", id: "nid" },
    { title: "NITSER Act", year: "2007", description: "National Institutes of Technology.", id: "nit_act" },
    { title: "Visva-Bharati Act", year: "1951", description: "Visva-Bharati University.", id: "visva_bharati" },
    { title: "Water Cess Act", year: "1977", description: "Levy and collection of a cess on water.", id: "water_cess" },
    { title: "Indian Forest Act", year: "1927", description: "Law relating to forests.", id: "indian_forest" },
    { title: "Clinical Establishments Act", year: "2010", description: "Registration and regulation of clinical establishments.", id: "clinical_establishments" },
    { title: "Homoeopathy Central Council Act", year: "1973", description: "Constitution of the Central Council of Homoeopathy.", id: "homoeopathy" },
    { title: "IMCC Act", year: "1970", description: "Indian Medicine Central Council.", id: "indian_medicine" },
    { title: "Mental Health Act", year: "1987", description: "Law relating to mental health.", id: "mental_health_1987" },
    { title: "Transplantation of Human Organs Act", year: "1994", description: "Regulation of removal, storage and transplantation of human organs.", id: "thoa" },
    { title: "Drugs and Magic Remedies Act", year: "1954", description: "Control of objectionable advertisements.", id: "drugs_magic" },
    { title: "Contract Labour Act", year: "1970", description: "Regulation and abolition of contract labour.", id: "contract_labour" },
    { title: "EPF Act", year: "1952", description: "Employees' Provident Funds.", id: "epf" },
    { title: "ESI Act", year: "1948", description: "Employees' State Insurance.", id: "esi" },
    { title: "Employment Exchanges Act", year: "1959", description: "Compulsory notification of vacancies.", id: "employment_exchanges" },
    { title: "Equal Remuneration Act", year: "1976", description: "Equal remuneration to men and women workers.", id: "equal_remuneration" },
    { title: "Payment of Bonus Act", year: "1965", description: "Payment of bonus to employees.", id: "bonus_act" },
    { title: "Weekly Holidays Act", year: "1942", description: "Grant of weekly holidays.", id: "weekly_holidays" },
    { title: "Arbitration Act", year: "1940", description: "Law relating to arbitration.", id: "arbitration_1940" },
    { title: "Civil Defence Act", year: "1968", description: "Civil defence measures.", id: "civil_defence" },
    { title: "Gram Nyayalayas Act", year: "2008", description: "Establishment of Gram Nyayalayas.", id: "gram_nyayalayas" },
    { title: "Judges (Inquiry) Act", year: "1968", description: "Inquiry into the conduct of Judges.", id: "judges_inquiry" },
    { title: "Judges (Protection) Act", year: "1985", description: "Protection of Judges.", id: "judges_protection" },
    { title: "Special Courts Act", year: "1979", description: "Establishment of Special Courts.", id: "special_courts" },
    { title: "Advocates Welfare Fund Act", year: "2001", description: "Constitution of a welfare fund for advocates.", id: "advocates_welfare" },
    { title: "Sheriff of Calcutta Act", year: "1931", description: "Power of custody of the Sheriff of Calcutta.", id: "sheriff_calcutta" },
    { title: "Press Council Act", year: "1978", description: "Establishment of a Press Council.", id: "press_council" },
    { title: "Sports Broadcasting Signals Act", year: "2007", description: "Mandatory sharing of sports broadcasting signals.", id: "sports_broadcasting" },
    { title: "TRAI Act", year: "1997", description: "Telecom Regulatory Authority of India.", id: "trai" },
    { title: "Telegraph Wires Act", year: "1950", description: "Unlawful possession of telegraph wires.", id: "telegraph_wires" },
    { title: "Indian Telegraph Act", year: "1885", description: "Law relating to telegraphs.", id: "indian_telegraph" },
    { title: "Indian Wireless Telegraphy Act", year: "1933", description: "Regulation of possession of wireless telegraphy apparatus.", id: "wireless_telegraphy" },
    { title: "Press and Registration of Books Act", year: "1867", description: "Regulation of printing presses and newspapers.", id: "prb" },
    { title: "Newspaper (Price and Page) Act", year: "1956", description: "Regulation of price and pages of newspapers.", id: "newspaper_price" },
    { title: "Dock Workers (Regulation) Act", year: "1948", description: "Regulation of employment of dock workers.", id: "dock_workers_reg" },
    { title: "Motor Transport Workers Act", year: "1961", description: "Welfare of motor transport workers.", id: "motor_transport" },
    { title: "NHAI Act", year: "1988", description: "National Highways Authority of India.", id: "nhai" },
    { title: "Road Transport Corporations Act", year: "1950", description: "Incorporation and regulation of Road Transport Corporations.", id: "rtc" },
    { title: "Seamen's Provident Fund Act", year: "1966", description: "Provident fund for seamen.", id: "seamen_pf" },
    { title: "Carriage of Goods by Sea Act", year: "1925", description: "Law relating to the carriage of goods by sea.", id: "cogsa_1925" },
    { title: "Land Acquisition Act", year: "1894", description: "Acquisition of land for public purposes.", id: "land_acquisition_1894" },
    { title: "Ancient Monuments Preservation Act", year: "1904", description: "Preservation of ancient monuments.", id: "ancient_monuments_1904" },
    { title: "Explosive Substances Act", year: "1908", description: "Punishment for causing explosion.", id: "explosive_substances" },
    { title: "Nuclear Damage Civil Liability Act", year: "2010", description: "Civil liability for nuclear damage.", id: "nuclear_liability" },
    { title: "Explosives Act", year: "1884", description: "Manufacture, possession, use, sale, transport and importation of explosives.", id: "explosives" },
    { title: "Lotteries (Regulation) Act", year: "1998", description: "Regulation of lotteries.", id: "lotteries" },
    { title: "Public Gambling Act", year: "1867", description: "Punishment for public gambling.", id: "public_gambling" },
    { title: "Registration of Births and Deaths Act", year: "1969", description: "Regulation of registration of births and deaths.", id: "births_deaths" },
    { title: "Haj Committee Act", year: "2002", description: "Establishment of Haj Committee.", id: "haj_committee" },
    { title: "Jallianwala Bagh National Memorial Act", year: "1951", description: "National Memorial for Jallianwala Bagh.", id: "jallianwala" },
    { title: "KVIC Act", year: "1956", description: "Khadi and Village Industries Commission.", id: "kvic" },
    { title: "NCC Act", year: "1948", description: "National Cadet Corps.", id: "ncc" },
    { title: "NCSK Act", year: "1993", description: "National Commission for Safai Karamcharis.", id: "ncsk" },
    { title: "Terrorist Affected Areas Act", year: "1984", description: "Special Courts for terrorist affected areas.", id: "terrorist_courts" },
    { title: "Navy Act", year: "1957", description: "Law relating to the Navy.", id: "navy_act" },
    { title: "Army Act", year: "1950", description: "Law relating to the Army.", id: "army_act" },
    { title: "Air Force Act", year: "1950", description: "Law relating to the Air Force.", id: "air_force_act" },
    // Additional 100 Acts (Batch 2)
    { title: "University of Hyderabad Act", year: "1974", description: "Establishment of the University of Hyderabad.", id: "uoh_act" },
    { title: "University of Delhi Act", year: "1922", description: "Establishment of the University of Delhi.", id: "du_act" },
    { title: "Aligarh Muslim University Act", year: "1920", description: "Establishment of the Aligarh Muslim University.", id: "amu_act" },
    { title: "Pondicherry University Act", year: "1985", description: "Establishment of the Pondicherry University.", id: "pondicherry_univ" },
    { title: "Tezpur University Act", year: "1993", description: "Establishment of Tezpur University.", id: "tezpur_univ" },
    { title: "Assam University Act", year: "1989", description: "Establishment of Assam University.", id: "assam_univ" },
    { title: "Maulana Azad National Urdu University Act", year: "1996", description: "Establishment of MANUU.", id: "manuu" },
    { title: "Mahatma Gandhi Antarrashtriya Hindi Vishwavidyalaya Act", year: "1996", description: "Establishment of the University.", id: "mgahv" },
    { title: "English and Foreign Languages University Act", year: "2006", description: "Establishment of EFLU.", id: "eflu" },
    { title: "Rajiv Gandhi University Act", year: "2006", description: "Establishment of Rajiv Gandhi University.", id: "rgu" },
    { title: "Sikkim University Act", year: "2006", description: "Establishment of Sikkim University.", id: "sikkim_univ" },
    { title: "Tripura University Act", year: "2006", description: "Establishment of Tripura University.", id: "tripura_univ" },
    { title: "Indira Gandhi National Tribal University Act", year: "2007", description: "Establishment of IGNTU.", id: "igntu" },
    { title: "Central Agricultural University Act", year: "1992", description: "Establishment of Central Agricultural University.", id: "cau" },
    { title: "Indian Maritime University Act", year: "2008", description: "Establishment of Indian Maritime University.", id: "imu" },
    { title: "South Asian University Act", year: "2008", description: "Establishment of South Asian University.", id: "sau" },
    { title: "Nalanda University Act", year: "2010", description: "Establishment of Nalanda University.", id: "nalanda" },
    { title: "Rani Lakshmi Bai Central Agricultural University Act", year: "2014", description: "Establishment of the University.", id: "rlbcau" },
    { title: "National Forensic Sciences University Act", year: "2020", description: "Establishment of NFSU.", id: "nfsu" },
    { title: "Rashtriya Raksha University Act", year: "2020", description: "Establishment of RRU.", id: "rru" },
    { title: "Gati Shakti Vishwavidyalaya Act", year: "2022", description: "Establishment of Gati Shakti Vishwavidyalaya.", id: "gsv" },
    { title: "IISER Act", year: "2010", description: "Indian Institutes of Science Education and Research.", id: "iiser" },
    { title: "IIIT Act", year: "2014", description: "Indian Institutes of Information Technology.", id: "iiit" },
    { title: "IIM Act", year: "2017", description: "Indian Institutes of Management.", id: "iim" },
    { title: "NIPER Act", year: "1998", description: "National Institute of Pharmaceutical Education and Research.", id: "niper" },
    { title: "AIIMS Act", year: "1956", description: "All India Institute of Medical Sciences.", id: "aiims" },
    { title: "PGIMER Chandigarh Act", year: "1966", description: "Post-Graduate Institute of Medical Education and Research.", id: "pgimer" },
    { title: "Sree Chitra Tirunal Institute Act", year: "1980", description: "Sree Chitra Tirunal Institute for Medical Sciences and Technology.", id: "sctimst" },
    { title: "NIMHANS Bangalore Act", year: "2012", description: "National Institute of Mental Health and Neuro-Sciences.", id: "nimhans" },
    { title: "Rajiv Gandhi National Institute of Youth Development Act", year: "2012", description: "Establishment of the Institute.", id: "rgniyd" },
    { title: "NIFT Act", year: "2006", description: "National Institute of Fashion Technology.", id: "nift" },
    { title: "Footwear Design and Development Institute Act", year: "2017", description: "Establishment of FDDI.", id: "fddi" },
    { title: "Indian Institute of Petroleum and Energy Act", year: "2017", description: "Establishment of IIPE.", id: "iipe" },
    { title: "National Sports University Act", year: "2018", description: "Establishment of National Sports University.", id: "nsu" },
    { title: "Central Sanskrit Universities Act", year: "2020", description: "Establishment of Central Sanskrit Universities.", id: "csu" },
    { title: "Institute of Teaching and Research in Ayurveda Act", year: "2020", description: "Establishment of the Institute.", id: "itra" },
    { title: "National Commission for Allied and Healthcare Professions Act", year: "2021", description: "Regulation of allied and healthcare professions.", id: "ncahp" },
    { title: "NaBFID Act", year: "2021", description: "National Bank for Financing Infrastructure and Development.", id: "nabfid" },
    { title: "Regional Rural Banks Act", year: "1976", description: "Incorporation and regulation of Regional Rural Banks.", id: "rrb" },
    { title: "NABARD Act", year: "1981", description: "National Bank for Agriculture and Rural Development.", id: "nabard" },
    { title: "Public Financial Institutions Act", year: "1983", description: "Obligation as to Fidelity and Secrecy.", id: "pfi_fidelity" },
    { title: "Sick Industrial Companies Repeal Act", year: "2003", description: "Repeal of SICA.", id: "sica_repeal" },
    { title: "Industrial Finance Corporation Repeal Act", year: "1993", description: "Repeal of IFCI Act.", id: "ifci_repeal" },
    { title: "UTI Repeal Act", year: "2002", description: "Repeal of UTI Act.", id: "uti_repeal" },
    { title: "Securities Contracts (Regulation) Act", year: "1956", description: "Regulation of stock exchanges.", id: "scra" },
    { title: "Depositories Act", year: "1996", description: "Regulation of depositories.", id: "depositories" },
    { title: "Personal Injuries (Compensation Insurance) Act", year: "1963", description: "Insurance for personal injuries.", id: "personal_injuries_comp" },
    { title: "Personal Injuries (Emergency Provisions) Act", year: "1962", description: "Emergency provisions for personal injuries.", id: "personal_injuries_emerg" },
    { title: "Employers' Liability Act", year: "1938", description: "Liability of employers for injuries to workmen.", id: "employers_liability" },
    { title: "Fatal Accidents Act", year: "1855", description: "Compensation for families for loss occasioned by death.", id: "fatal_accidents" },
    { title: "Emigration Act", year: "1983", description: "Regulation of emigration.", id: "emigration" },
    { title: "Reciprocity Act", year: "1943", description: "Reciprocity in legal proceedings.", id: "reciprocity" },
    { title: "Immigration (Carriers' Liability) Act", year: "2000", description: "Liability of carriers for bringing immigrants.", id: "immigration_liability" },
    { title: "Diplomatic Relations (Vienna Convention) Act", year: "1972", description: "Effect to the Vienna Convention on Diplomatic Relations.", id: "diplomatic_relations" },
    { title: "United Nations (Privileges and Immunities) Act", year: "1947", description: "Privileges and immunities of the UN.", id: "un_privileges" },
    { title: "United Nations (Security Council) Act", year: "1947", description: "Measures under Article 41 of the Charter.", id: "un_security" },
    { title: "Geneva Conventions Act", year: "1960", description: "Effect to the Geneva Conventions.", id: "geneva_conventions" },
    { title: "Anti-Apartheid (United Nations Convention) Act", year: "1981", description: "Effect to the International Convention.", id: "anti_apartheid" },
    { title: "SAARC Convention (Suppression of Terrorism) Act", year: "1993", description: "Effect to the SAARC Convention.", id: "saarc_terrorism" },
    { title: "Tokyo Convention Act", year: "1975", description: "Effect to the Tokyo Convention.", id: "tokyo_convention" },
    { title: "Anti-Hijacking Act", year: "2016", description: "Suppression of unlawful seizure of aircraft.", id: "anti_hijacking" },
    { title: "Suppression of Unlawful Acts against Safety of Civil Aviation Act", year: "1982", description: "Safety of civil aviation.", id: "civil_aviation_safety" },
    { title: "Suppression of Unlawful Acts against Safety of Maritime Navigation Act", year: "2002", description: "Safety of maritime navigation.", id: "maritime_safety" },
    { title: "Chemical Weapons Convention Act", year: "2000", description: "Effect to the Chemical Weapons Convention.", id: "chemical_weapons" },
    { title: "Special Protection Group Act", year: "1988", description: "Constitution of the SPG.", id: "spg" },
    { title: "Intelligence Organisations (Restriction on Rights) Act", year: "1985", description: "Restriction of rights of intelligence personnel.", id: "intel_rights" },
    { title: "Police Forces (Restriction of Rights) Act", year: "1966", description: "Restriction of rights of police personnel.", id: "police_rights" },
    { title: "CRPF Act", year: "1949", description: "Central Reserve Police Force.", id: "crpf" },
    { title: "ITBPF Act", year: "1992", description: "Indo-Tibetan Border Police Force.", id: "itbpf" },
    { title: "Sashastra Seema Bal Act", year: "2007", description: "Sashastra Seema Bal.", id: "ssb" },
    { title: "Assam Rifles Act", year: "2006", description: "Assam Rifles.", id: "assam_rifles" },
    { title: "Railway Protection Force Act", year: "1957", description: "Railway Protection Force.", id: "rpf" },
    { title: "National Security Guard Act", year: "1986", description: "National Security Guard.", id: "nsg" },
    { title: "Seaward Artillery Practice Act", year: "1949", description: "Seaward artillery practice.", id: "seaward_artillery" },
    { title: "Manoeuvres, Field Firing and Artillery Practice Act", year: "1938", description: "Field firing and artillery practice.", id: "field_firing" },
    { title: "Works of Defence Act", year: "1903", description: "Restrictions upon the use and enjoyment of land.", id: "works_defence" },
    { title: "Cantonments (Extension of Rent Control Laws) Act", year: "1957", description: "Extension of rent control laws to cantonments.", id: "cantonments_rent" },
    { title: "Reserve and Auxiliary Air Forces Act", year: "1952", description: "Reserve and Auxiliary Air Forces.", id: "reserve_air_force" },
    { title: "Territorial Army Act", year: "1948", description: "Territorial Army.", id: "territorial_army" },
    { title: "Commanders-in-Chief (Change in Designation) Act", year: "1955", description: "Change in designation.", id: "commanders_designation" },
    { title: "Lok Sahayak Sena Act", year: "1956", description: "Lok Sahayak Sena.", id: "lok_sahayak_sena" },
    { title: "Exchange of Prisoners Act", year: "1948", description: "Exchange of prisoners.", id: "exchange_prisoners" },
    { title: "Resettlement of Displaced Persons Act", year: "1948", description: "Resettlement of displaced persons.", id: "resettlement" },
    { title: "Displaced Persons (Claims) Supplementary Act", year: "1954", description: "Supplementary claims.", id: "displaced_claims" },
    { title: "Displaced Persons (Compensation and Rehabilitation) Act", year: "1954", description: "Compensation and rehabilitation.", id: "displaced_comp" },
    { title: "Administration of Evacuee Property Act", year: "1950", description: "Administration of evacuee property.", id: "evacuee_property" },
    { title: "Evacuee Interest (Separation) Act", year: "1951", description: "Separation of evacuee interest.", id: "evacuee_interest" },
    { title: "Transfer of Evacuee Deposits Act", year: "1954", description: "Transfer of evacuee deposits.", id: "evacuee_deposits" },
    { title: "Goa, Daman and Diu (Administration) Act", year: "1962", description: "Administration of Goa, Daman and Diu.", id: "goa_admin" },
    { title: "Pondicherry (Administration) Act", year: "1962", description: "Administration of Pondicherry.", id: "pondicherry_admin" },
    { title: "Dadra and Nagar Haveli Act", year: "1961", description: "Administration of Dadra and Nagar Haveli.", id: "dadra_admin" },
    { title: "State of Nagaland Act", year: "1962", description: "Formation of the State of Nagaland.", id: "nagaland_state" },
    { title: "Punjab Reorganisation Act", year: "1966", description: "Reorganisation of Punjab.", id: "punjab_reorg" },
    { title: "State of Himachal Pradesh Act", year: "1970", description: "Establishment of the State of Himachal Pradesh.", id: "hp_state" },
    { title: "North-Eastern Areas (Reorganisation) Act", year: "1971", description: "Reorganisation of North-Eastern Areas.", id: "ne_reorg" },
    { title: "State of Mizoram Act", year: "1986", description: "Establishment of the State of Mizoram.", id: "mizoram_state" },
    { title: "State of Arunachal Pradesh Act", year: "1986", description: "Establishment of the State of Arunachal Pradesh.", id: "ap_state" },
    { title: "Goa, Daman and Diu Reorganisation Act", year: "1987", description: "Reorganisation of Goa, Daman and Diu.", id: "goa_reorg" },
    { title: "Bihar Reorganisation Act", year: "2000", description: "Reorganisation of Bihar.", id: "bihar_reorg" },
    { title: "Madhya Pradesh Reorganisation Act", year: "2000", description: "Reorganisation of Madhya Pradesh.", id: "mp_reorg" },
  ];

  const handleActSelect = (act: Act) => {
    setSelectedAct(act);
    setAcademicAnalysis(null);
    setSectionSearchQuery('');
  };

  const filteredActs = acts.filter(act => 
    act.title.toLowerCase().includes(academicSearch.toLowerCase()) || 
    act.description.toLowerCase().includes(academicSearch.toLowerCase())
  );

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex h-screen font-sans bg-background text-foreground">
      <Toaster position="top-center" richColors />
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card text-card-foreground flex flex-col p-6 border-r border-border shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-10 flex items-center gap-3">
          <LexalyseLogo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">Lex<span className="font-light">alyse</span></h1>
            <p className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1">AI-Powered Legal Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab === 'dash'} onClick={() => { setActiveTab('dash'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<BookOpen size={18}/>} label="Academic Section" active={activeTab === 'academic'} onClick={() => { setActiveTab('academic'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<FileText size={18}/>} label="Precedent Repository" active={activeTab === 'repository'} onClick={() => { setActiveTab('repository'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<ScrollText size={18}/>} label="Statutory Bridge" active={activeTab === 'bridge'} onClick={() => { setActiveTab('bridge'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Quote size={18}/>} label="Legal Maxims" active={activeTab === 'maxims'} onClick={() => { setActiveTab('maxims'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<BrainCircuit size={18}/>} label="Doctrines/Principles" active={activeTab === 'doctrines'} onClick={() => { setActiveTab('doctrines'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Gavel size={18}/>} label="Advanced Arguments" active={activeTab === 'moot'} onClick={() => { setActiveTab('moot'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Plus size={18}/>} label="Lexalyse DraftDash" active={activeTab === 'draft'} onClick={() => { setActiveTab('draft'); setIsMobileMenuOpen(false); }} />
          <NavItem icon={<Sparkles size={18}/>} label="Lexalyse AI" active={activeTab === 'research'} onClick={() => { setActiveTab('research'); setIsMobileMenuOpen(false); }} />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-background">
        
        {/* HEADER / TOP BAR */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 bg-background border-border">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-secondary rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h1 className="text-sm font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
                {activeTab === 'dash' ? 'Dashboard' : 
                 activeTab === 'academic' ? 'Academic Section' :
                 activeTab === 'repository' ? 'Precedent Repository' :
                 activeTab === 'bridge' ? 'Statutory Bridge' :
                 activeTab === 'maxims' ? 'Legal Maxims' :
                 activeTab === 'doctrines' ? 'Doctrines & Principles' :
                 activeTab === 'moot' ? 'Advanced Arguments' :
                 activeTab === 'draft' ? 'DraftDash' :
                 activeTab === 'research' ? (
                   <>
                     Lexalyse AI
                     <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-full border border-primary/20 tracking-[0.1em]">PRO</span>
                   </>
                 ) : ''}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-4">
            <span className="hidden md:inline text-xs font-medium italic text-muted-foreground">"Ignorantia juris non excusat"</span>
            
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-foreground text-xs border border-border shrink-0">AD</div>
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 relative ${showDisclaimer ? 'pb-32 md:pb-24' : ''}`}>
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dash' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="h-full flex flex-col items-center justify-center text-center px-4 md:px-20 relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10" />

              <div className="max-w-4xl relative z-10">
                {/* Top Badge */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary border border-border mb-12"
                >
                  <span className="text-[10px] md:text-xs font-medium tracking-tight text-muted-foreground">
                    Introducing Lexalyse: Elevating legal research and identifying critical precedents.
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-6xl md:text-9xl font-serif font-bold tracking-tighter text-foreground mb-6"
                >
                  Lexalyse
                </motion.h1>

                {/* Sub Heading */}
                <motion.h2 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl md:text-4xl font-serif italic text-muted-foreground mb-12"
                >
                  AI Powered Legal Intelligence
                </motion.h2>

                {/* Motivational Text */}
                <motion.p 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-light mb-16"
                >
                  Empowering law students and professors to navigate the complexities of jurisprudence with precision and speed. 
                  Bridging the gap between traditional legal research and modern AI intelligence, we provide the clarity needed to master the law.
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* PRECEDENT REPOSITORY SECTION */}
          {activeTab === 'repository' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8 max-w-6xl mx-auto"
            >
              <div className="mb-8">
                <h2 className="text-4xl font-serif text-foreground mb-2">Precedent Repository</h2>
                <p className="text-muted-foreground">Search judgements by case name, citation or topic...</p>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                  type="text" 
                  placeholder="Search judgements (e.g., Kesavananda Bharati, Basic Structure)..." 
                  className="w-full pl-12 pr-32 py-5 bg-card border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-muted-foreground/50 transition-all shadow-lg relative z-10"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCaseSearch()}
                />
                <button 
                  onClick={handleCaseSearch}
                  disabled={isRepoLoading || !repoSearch.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50 z-20"
                >
                  {isRepoLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Result Card */}
              {caseResult ? (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header */}
                  <div className="bg-secondary/30 p-8 border-b border-border flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-8 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2.5">
                        <FileText size={14} /> {caseResult.citation}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} /> {caseResult.bench}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} /> {caseResult.year}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs">{caseResult.year}</div>
                  </div>
 
                  {/* Title & Tags */}
                  <div className="p-8 border-b border-border flex justify-between items-start">
                    <div>
                      <h1 className="text-4xl font-serif text-foreground mb-4">{caseResult.caseName}</h1>
                      <div className="flex flex-wrap gap-2">
                        {caseResult.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-secondary text-muted-foreground text-xs rounded-full border border-border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const text = `
Case Name: ${caseResult.caseName}
Year: ${caseResult.year}
Facts: ${caseResult.facts}
Core Issues: ${caseResult.coreIssues}
Arguments: ${caseResult.arguments}
Judgement: ${caseResult.judgement}
Holding: ${caseResult.holding}
Status: ${caseResult.status}
Ratio Decidendi: ${caseResult.ratioDecidendi}
                        `.trim();
                        navigator.clipboard.writeText(text);
                        toast.success("Case summary copied");
                      }}
                      className="p-3 hover:bg-secondary rounded-2xl text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
                      title="Copy case summary"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
 
                  {/* Content Columns - 4 Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Facts */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4 text-amber-600 text-xs font-bold uppercase tracking-widest">
                        <FileText size={14} /> Facts
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {caseResult.facts}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-2 text-foreground text-xs font-bold uppercase tracking-widest">
                        <AlertTriangle size={14} /> Core Issues
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {caseResult.coreIssues}
                      </p>
                    </div>
 
                    {/* Arguments & Judgement */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4 text-amber-600 text-xs font-bold uppercase tracking-widest">
                        <ArrowLeftRight size={14} /> Arguments
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {caseResult.arguments}
                      </p>
 
                      <div className="flex items-center gap-2 mb-4 text-foreground text-xs font-bold uppercase tracking-widest">
                        <Gavel size={14} /> Judgement
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {caseResult.judgement}
                      </p>
                    </div>
 
                    {/* Holding & Status */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4 text-foreground text-xs font-bold uppercase tracking-widest">
                        <CheckCircle size={14} /> Holding
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {caseResult.holding}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-4 text-foreground text-xs font-bold uppercase tracking-widest">
                        <ShieldAlert size={14} /> Status
                      </div>
                      <p className={`text-sm font-bold ${caseResult.status === 'Overruled' ? 'text-red-600' : 'text-green-600'}`}>
                        {caseResult.status}
                      </p>
                    </div>
 
                    {/* Ratio Decidendi & Sources */}
                    <div className="p-6 bg-secondary/20 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4 text-foreground text-xs font-bold uppercase tracking-widest">
                          <Scale size={14} /> Ratio Decidendi
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed italic mb-6">
                          "{caseResult.ratioDecidendi}"
                        </p>
                      </div>
                      
                      {/* Removed Source section as per request */}
                    </div>
                  </div>
                </div>
              ) : (
                /* Example Cases Grid */
                !isRepoLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {EXAMPLE_CASES.map((example, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleExampleClick(example)}
                        className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/30 hover:bg-secondary transition-all group shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{example.year}</span>
                          <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <h3 className="text-lg font-serif text-foreground mb-2 group-hover:text-primary transition-colors">{example.caseName}</h3>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{example.holding}</p>
                        <div className="flex flex-wrap gap-2">
                          {example.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 bg-muted text-muted-foreground rounded border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {!caseResult && !isRepoLoading && (
                <div className="text-center py-10 text-gray-600">
                  <p className="text-sm">Select an example above or search for any other judgement.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ACADEMIC SECTION */}
          {activeTab === 'academic' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col"
            >
              {!selectedAct ? (
                // LIBRARY VIEW
                <div className="space-y-10 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-serif text-foreground mb-3">Academic Resources</h2>
                      <p className="text-muted-foreground max-w-2xl leading-relaxed">Browse our library of simplified bare acts. Each act is broken down into easy-to-understand sections with key terms and summaries.</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {filteredActs.length} Acts Available
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search for an Act or enter Section (e.g., Contract, IPC 302)..." 
                      className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-muted-foreground/50 transition-all shadow-lg relative z-10"
                      value={academicSearch}
                      onChange={(e) => setAcademicSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {filteredActs.map(act => (
                      <motion.div 
                        key={act.id} 
                        whileHover={{ y: -8 }}
                        onClick={() => handleActSelect(act)}
                        className="bg-card border-border p-8 rounded-3xl border shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                            <Book size={24} />
                          </div>
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground uppercase tracking-widest">{act.year}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 transition-colors text-foreground group-hover:text-primary relative z-10">{act.title}</h3>
                        <p className="text-sm text-muted-foreground mb-8 line-clamp-2 leading-relaxed relative z-10">{act.description}</p>
                        <div className="flex items-center text-xs font-bold uppercase tracking-widest text-primary group-hover:gap-3 transition-all relative z-10">
                          Explore Act <ArrowRight size={14} className="ml-1" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                // READER VIEW (Existing Split View)
                <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={() => setSelectedAct(null)}
                    className="flex items-center text-sm text-muted-foreground mb-4 w-fit transition-colors hover:text-foreground"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Back to Library
                  </button>

                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">{selectedAct.title} <span className="text-muted-foreground font-normal text-lg">({selectedAct.year})</span></h2>
                    <div className="flex items-center space-x-2 w-1/3">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                        <input 
                          type="text" 
                          placeholder={`Search ${selectedAct.title === 'Constitution' ? 'Article' : 'Section'} in ${selectedAct.title}...`}
                          className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-muted border-border text-foreground placeholder-muted-foreground"
                          value={sectionSearchQuery}
                          onChange={(e) => setSectionSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAcademicAnalysis();
                            }
                          }}
                        />
                      </div>
                      <button 
                        onClick={handleAcademicAnalysis}
                        disabled={isAcademicLoading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isAcademicLoading ? '...' : 'Go'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border border-border bg-card">
                    {/* SIMPLIFIED TEXT ONLY */}
                    <div className="flex-1 p-8 md:p-12 overflow-y-auto transition-colors relative">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Simplified Analysis (AI)</span>
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20 uppercase tracking-widest">Advanced AI</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            {sectionSearchQuery ? `${selectedAct.title === 'Constitution' ? 'Art.' : 'Sec.'} ${sectionSearchQuery}` : `Select ${selectedAct.title === 'Constitution' ? 'Article' : 'Section'}`}
                          </span>
                          {academicAnalysis && (
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(academicAnalysis);
                                toast.success("Analysis copied");
                              }}
                              className="p-1.5 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-foreground"
                              title="Copy analysis"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {academicAnalysis ? (
                        <div className="markdown-body max-w-4xl mx-auto">
                          <ReactMarkdown>{academicAnalysis}</ReactMarkdown>
                          {isAcademicLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                        </div>
                      ) : isAcademicLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-muted-foreground">Analyzing {selectedAct.title === 'Constitution' ? 'article' : 'section'}...</p>
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mb-8 mx-auto border border-border">
                            <Sparkles size={40} className="text-muted-foreground/30" />
                          </div>
                          <h3 className="text-2xl font-serif font-bold mb-4 text-foreground">What this actually means:</h3>
                          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Enter {selectedAct.title === 'Constitution' ? 'an article' : 'a section'} number above and click "Go" to generate a simplified, student-friendly explanation using AI.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MOOT COURT SECTION */}
          {activeTab === 'moot' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="mb-10">
                <h2 className="text-4xl font-serif flex items-center gap-4 text-foreground">
                  <Scale className="text-primary" size={36} /> Advanced Arguments
                </h2>
                <p className="text-muted-foreground mt-3 max-w-2xl text-lg leading-relaxed">
                  Advanced AI-powered argumentation partner. Input your legal arguments to find loopholes, precedents, and strategic improvements.
                </p>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">
                {/* Left Panel - Input */}
                <div className="lg:col-span-4 flex flex-col space-y-8">
                  {/* Side Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 block">Select Your Side</label>
                    <div className="flex bg-secondary p-1.5 rounded-2xl border border-border">
                      <button
                        onClick={() => setMootSide('petitioner')}
                        className={cn(
                          "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                          mootSide === 'petitioner' 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                      >
                        Petitioner
                      </button>
                      <button
                        onClick={() => setMootSide('respondent')}
                        className={cn(
                          "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                          mootSide === 'respondent' 
                            ? "bg-primary text-primary-foreground shadow-lg" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                      >
                        Respondent
                      </button>
                    </div>
                  </div>

                  {/* Argument Input */}
                  <div className="flex-1 flex flex-col min-h-[300px]">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 block">Your Argument</label>
                    <textarea
                      className="flex-1 w-full bg-card border border-border rounded-3xl p-6 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/30 font-mono leading-relaxed shadow-inner"
                      placeholder="Enter your legal argument here. Be detailed about the facts and legal grounds..."
                      value={mootArgument}
                      onChange={(e) => setMootArgument(e.target.value)}
                    />
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={handleMootAnalysis}
                    disabled={isMootLoading || !mootArgument.trim()}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold tracking-[0.2em] uppercase shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMootLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Gavel size={20} /> Analyze Argument</>
                    )}
                  </button>

                  {/* Disclaimer */}
                  <div className="bg-secondary/50 border border-border rounded-2xl p-5 flex gap-4 items-start">
                    <AlertTriangle className="text-primary shrink-0" size={18} />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-bold text-foreground">Disclaimer:</span> This is an AI-generated response for educational and simulation purposes only. It is <span className="text-primary font-bold">not binding</span> and does not constitute professional legal advice. Always verify citations and consult a qualified attorney.
                    </p>
                  </div>
                </div>

                {/* Right Panel - Output */}
                <div className="lg:col-span-8 bg-card border border-border rounded-[2.5rem] flex flex-col p-10 overflow-y-auto shadow-2xl relative">
                  {mootAnalysis ? (
                    <div className="w-full h-full text-left">
                      <div className="flex items-center justify-between gap-3 mb-8">
                        <div className="flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                          <Scale size={18} /> Judicial Analysis
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(mootAnalysis);
                            toast.success("Analysis copied to clipboard");
                          }}
                          className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                          title="Copy analysis"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                        <ReactMarkdown>{mootAnalysis}</ReactMarkdown>
                        {isMootLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                      </div>
                    </div>
                  ) : isMootLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <Scale className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
                      </div>
                      <p className="text-muted-foreground font-medium tracking-wide">The Senior Advocate is reviewing your argument...</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-8 shadow-inner border border-border relative">
                         <Scale size={56} className="text-muted-foreground/30" />
                         <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      </div>
                      <h3 className="text-2xl font-serif text-muted-foreground mb-3">Ready to judge your case</h3>
                      <p className="text-sm text-muted-foreground/60 max-w-xs">Enter your argument on the left to begin the judicial analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STATUTORY BRIDGE SECTION */}
          {activeTab === 'bridge' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-5xl mx-auto py-12"
            >
              <div className="text-center mb-16">
                <h2 className="text-5xl font-serif font-bold mb-6 text-foreground">Statutory Bridge</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                  Transition seamlessly between old and new criminal laws. Instantly map sections from IPC to BNS, CrPC to BNSS, and IEA to BSA.
                </p>
              </div>

              <div className="bg-card rounded-[2.5rem] shadow-2xl overflow-hidden mb-12 border border-border">
                <div className="p-10 md:p-16">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    
                    {/* Conversion Type */}
                    <div className="md:col-span-5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Conversion Type</label>
                      <div className="relative group">
                        <select 
                          value={bridgeConversionType}
                          onChange={(e) => setBridgeConversionType(e.target.value)}
                          className="w-full bg-secondary text-foreground border border-border rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        >
                          <option>IPC → BNS (Penal Code)</option>
                          <option>BNS → IPC (Penal Code)</option>
                          <option>CrPC → BNSS (Procedure)</option>
                          <option>BNSS → CrPC (Procedure)</option>
                          <option>IEA → BSA (Evidence)</option>
                          <option>BSA → IEA (Evidence)</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform group-hover:translate-y-[-40%]" size={18} />
                      </div>
                    </div>

                    {/* Section Number */}
                    <div className="md:col-span-4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">Section Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 302" 
                        value={bridgeSection}
                        onChange={(e) => setBridgeSection(e.target.value)}
                        className="w-full bg-secondary text-foreground border border-border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder-muted-foreground/50 transition-all"
                      />
                    </div>

                    {/* Convert Button */}
                    <div className="md:col-span-3">
                      <button 
                        onClick={handleBridgeConversion}
                        disabled={isBridgeLoading || !bridgeSection.trim()}
                        className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
                      >
                        {isBridgeLoading ? 'Converting...' : 'Convert'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Placeholder */}
              <div className="bg-card border-border rounded-[2.5rem] border p-12 text-center min-h-[300px] flex flex-col items-center justify-center shadow-2xl transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
                {bridgeResult ? (
                  <div className="w-full text-left relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-8">
                      <div className="flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                        <ArrowLeftRight size={18} /> Conversion Result
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(bridgeResult);
                          toast.success("Result copied to clipboard");
                        }}
                        className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                        title="Copy result"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                      <ReactMarkdown>{bridgeResult}</ReactMarkdown>
                      {isBridgeLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-secondary border border-border shadow-inner mx-auto">
                      <ArrowLeftRight className="text-muted-foreground/30" size={32} />
                    </div>
                    <p className="text-xl text-muted-foreground font-light">Enter a section number to see the mapping.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* LEGAL MAXIMS SECTION */}
          {activeTab === 'maxims' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto py-16 px-6"
            >
              <div className="text-center mb-20">
                <h2 className="text-6xl font-serif font-bold mb-6 text-foreground tracking-tighter">Legal Maxims</h2>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full mb-8" />
                <p className="text-muted-foreground max-w-2xl mx-auto text-xl leading-relaxed font-light">
                  A comprehensive directory of fundamental Latin principles that form the bedrock of modern jurisprudence.
                </p>
              </div>

              <div className="relative mb-24 group">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                <input 
                  type="text" 
                  placeholder="Search for a maxim or definition..." 
                  className="w-full pl-16 pr-6 py-6 bg-card border border-border rounded-[2rem] text-foreground text-xl focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-2xl backdrop-blur-sm transition-all relative z-10"
                  value={maximSearch}
                  onChange={(e) => setMaximSearch(e.target.value)}
                />
              </div>

              <div className="space-y-32 pb-20">
                {/* AI Search Result Modal */}
                <AnimatePresence>
                  {maximResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-card border border-border rounded-[2.5rem] p-10 mb-16 shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] rounded-full -mr-40 -mt-40" />
                      <button 
                        onClick={() => setMaximResult(null)}
                        className="absolute top-6 right-6 p-2.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all z-10"
                      >
                        <X size={20} />
                      </button>
                      
                      <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles size={24} />
                          </div>
                          <h3 className="text-2xl font-serif font-bold text-foreground">AI Maxim Analysis</h3>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(maximResult);
                            toast.success("Analysis copied");
                          }}
                          className="p-2.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
                          title="Copy analysis"
                        >
                          <Copy size={20} />
                        </button>
                      </div>

                      <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                        <ReactMarkdown>{maximResult}</ReactMarkdown>
                        {isMaximLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {sortedLetters.map((letter) => {
                  const filteredMaxims = groupedMaxims[letter].filter(m => 
                    m.term.toLowerCase().includes(maximSearch.toLowerCase()) || 
                    m.definition.toLowerCase().includes(maximSearch.toLowerCase())
                  );

                  if (filteredMaxims.length === 0) return null;

                  return (
                    <div key={letter} className="relative">
                      {/* Letter Heading */}
                      <div className="mb-12">
                        <h3 className="text-5xl font-serif font-bold text-foreground inline-block border-b-8 border-primary/20 pb-2 px-2">
                          {letter}
                        </h3>
                      </div>
                      
                      {/* Maxims List */}
                      <div className="space-y-12 pl-8 border-l-2 border-border">
                        {filteredMaxims.map((m, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex gap-8 group"
                          >
                            <span className="text-muted-foreground/30 font-serif italic text-2xl mt-1 min-w-[40px]">{idx + 1}.</span>
                            <div className="space-y-3">
                              <h4 className="text-3xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                {m.term}
                              </h4>
                              <p className="text-muted-foreground text-xl leading-relaxed italic font-light">
                                — {m.definition}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Thick separator line as seen in image under Q */}
                      <div className="mt-16 h-2 bg-gradient-to-r from-white/40 via-white/10 to-transparent w-full rounded-full" />
                    </div>
                  );
                })}

                {maximSearch && sortedLetters.every(l => 
                  groupedMaxims[l].filter(m => 
                    m.term.toLowerCase().includes(maximSearch.toLowerCase()) || 
                    m.definition.toLowerCase().includes(maximSearch.toLowerCase())
                  ).length === 0
                ) && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                      <Search size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-medium text-muted-foreground">No maxims found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* DOCTRINES & PRINCIPLES SECTION */}
          {activeTab === 'doctrines' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="max-w-6xl mx-auto py-16 px-6"
            >
              <div className="text-center mb-20">
                <h2 className="text-6xl font-serif font-bold mb-6 text-foreground tracking-tighter">Legal Doctrines</h2>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full mb-8" />
                <p className="text-muted-foreground max-w-2xl mx-auto text-xl leading-relaxed font-light">
                  Explore the foundational theories and judicial interpretations that shape the legal landscape.
                </p>
              </div>

              <div className="relative mb-24 group max-w-3xl mx-auto">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                <input 
                  type="text" 
                  placeholder="Search for a doctrine..." 
                  className="w-full pl-16 pr-40 py-6 bg-card border border-border rounded-[2rem] text-foreground text-xl focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-2xl backdrop-blur-sm transition-all relative z-10"
                  value={doctrineSearch}
                  onChange={(e) => setDoctrineSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doctrineSearch.trim() && handleDoctrineAnalysis(doctrineSearch)}
                />
                <button 
                  onClick={() => handleDoctrineAnalysis(doctrineSearch)}
                  disabled={isDoctrineLoading || !doctrineSearch.trim()}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all disabled:opacity-50 z-20 shadow-lg shadow-primary/20"
                >
                  {isDoctrineLoading ? '...' : 'Analyze'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {PROVIDED_DOCTRINES.filter(d => 
                  d.term.toLowerCase().includes(doctrineSearch.toLowerCase()) || 
                  d.definition.toLowerCase().includes(doctrineSearch.toLowerCase())
                ).map((doctrine, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleDoctrineAnalysis(doctrine.term)}
                    className="bg-card border border-border p-10 rounded-[2.5rem] hover:border-primary/50 transition-all group relative overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-primary/10 transition-all" />
                    
                    <div className="flex flex-col gap-6">
                      <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                        <BrainCircuit size={28} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {doctrine.term}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-sm font-light line-clamp-3">
                          {doctrine.definition}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center text-primary text-[10px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">
                      Deep Analysis <ChevronRight size={14} className="ml-1" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {doctrineSearch && PROVIDED_DOCTRINES.filter(d => 
                d.term.toLowerCase().includes(doctrineSearch.toLowerCase()) || 
                d.definition.toLowerCase().includes(doctrineSearch.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-24">
                  <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 border border-border shadow-inner relative">
                    <Search size={48} className="text-muted-foreground/30" />
                    <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                  </div>
                  <h3 className="text-3xl font-serif text-muted-foreground mb-3">No doctrines found</h3>
                  <p className="text-muted-foreground/60">Try adjusting your search terms or explore our directory</p>
                </div>
              )}

              {/* Analysis Modal */}
              <AnimatePresence>
                {selectedDoctrine && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-xl"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 40 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 40 }}
                      className="bg-card border border-border w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh]"
                    >
                      <div className="p-10 border-b border-border flex items-center justify-between bg-secondary/30">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <BrainCircuit size={28} />
                          </div>
                          <div>
                            <h3 className="text-3xl font-serif font-bold text-foreground leading-none">{selectedDoctrine}</h3>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mt-2">Lexalyse Judicial Analysis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {doctrineResult && (
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(doctrineResult);
                                toast.success("Analysis copied");
                              }}
                              className="p-3 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
                              title="Copy analysis"
                            >
                              <Copy size={20} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedDoctrine(null);
                              setDoctrineResult(null);
                            }}
                            className="p-3 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all"
                          >
                            <X size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="p-12 overflow-y-auto custom-scrollbar bg-card/50">
                        {isDoctrineLoading ? (
                          <div className="flex flex-col items-center justify-center py-32 space-y-8">
                            <div className="relative">
                              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                              <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                            </div>
                            <p className="text-muted-foreground font-medium tracking-[0.2em] uppercase text-xs animate-pulse">Synthesizing Legal Theory...</p>
                          </div>
                        ) : doctrineResult ? (
                          <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                            <div className="flex items-center gap-3 mb-8 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                              <Sparkles size={18} /> Expert Opinion
                            </div>
                            <div className="text-foreground text-lg leading-relaxed">
                              <ReactMarkdown>{doctrineResult}</ReactMarkdown>
                              {isDoctrineLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                            </div>
                            
                            <div className="mt-16 p-8 bg-secondary/50 border border-border rounded-3xl flex gap-6 items-start">
                              <AlertTriangle className="text-primary shrink-0 mt-1" size={24} />
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-bold text-foreground">Note:</span> This analysis is generated by Lexalyse AI for educational purposes. While we strive for 100% accuracy, legal interpretations can vary. Always consult the latest Supreme Court rulings and Bare Acts for official citations.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-24">
                            <p className="text-muted-foreground">Failed to load analysis. Please try again.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-10 border-t border-border bg-secondary/30 flex justify-end">
                        <button 
                          onClick={() => {
                            setSelectedDoctrine(null);
                            setDoctrineResult(null);
                          }}
                          className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold tracking-widest uppercase text-xs transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Close Analysis
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* LEXALYSE DRAFTDASH SECTION */}
          {activeTab === 'draft' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="max-w-6xl mx-auto py-16 px-6 w-full"
            >
              <div className="text-center mb-20">
                <h2 className="text-6xl font-serif font-bold mb-6 text-foreground tracking-tighter">Lexalyse DraftDash</h2>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full mb-8" />
                <p className="text-muted-foreground max-w-2xl mx-auto text-xl leading-relaxed font-light">
                  Professional legal drafting at your fingertips. Generate high-quality legal notices, agreements, and petitions in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-3">
                      <FileText size={18} className="text-primary" /> Document Type
                    </h3>
                    <div className="space-y-3">
                      {['Legal Notice', 'Rent Agreement', 'Employment Contract', 'Will / Testament', 'Power of Attorney', 'Partnership Deed', 'Non-Disclosure Agreement (NDA)', 'Consumer Complaint', 'Other / Custom'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setDraftType(type)}
                          className={cn(
                            "w-full text-left px-5 py-4 rounded-2xl transition-all text-sm font-medium border",
                            draftType === type 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary" 
                              : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {draftType === 'Other / Custom' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Specify Document Type</label>
                        <input 
                          type="text"
                          placeholder="e.g., Writ Petition, Bail Application..."
                          className="w-full bg-secondary/50 border border-border rounded-xl px-5 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                          value={customDraftType}
                          onChange={(e) => setCustomDraftType(e.target.value)}
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-secondary/30 border border-border p-8 rounded-[2.5rem] relative overflow-hidden">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-3">
                      <Plus size={18} className="text-primary" /> Quick Tips
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-4 leading-relaxed">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        Be specific about party names and addresses.
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        Mention the core dispute or terms clearly.
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        Include dates and monetary amounts if applicable.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Input & Output Panel */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="bg-card border border-border p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-3">
                      <Bot size={18} className="text-primary" /> Drafting Instructions
                    </h3>
                    <textarea
                      placeholder={`Provide details for your ${draftType}... (e.g., "Draft a legal notice for non-payment of rent for 3 months by tenant Mr. X residing at...")`}
                      className="w-full h-48 bg-secondary/30 border border-border rounded-[2rem] p-8 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none mb-8 placeholder:text-muted-foreground/30 font-serif text-lg leading-relaxed shadow-inner"
                      value={draftDetails}
                      onChange={(e) => setDraftDetails(e.target.value)}
                    />
                    <button
                      onClick={handleDraftGeneration}
                      disabled={isDraftLoading || !draftDetails.trim()}
                      className="w-full py-6 bg-primary text-primary-foreground rounded-[2rem] font-bold tracking-[0.2em] uppercase shadow-xl shadow-primary/20 flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {isDraftLoading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Generating Draft...
                        </>
                      ) : (
                        <>
                          <Sparkles size={24} /> Generate Professional Draft
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {draftResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.2)] relative"
                      >
                        <div className="p-8 border-b border-border flex items-center justify-between bg-secondary/30">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                              <FileText size={28} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-serif font-bold text-foreground leading-none">Generated {draftType === 'Other / Custom' ? customDraftType : draftType}</h3>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mt-2">Lexalyse Professional Draft</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(draftResult);
                                toast.success("Draft copied to clipboard");
                              }}
                              className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-2xl text-foreground transition-all flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] border border-border"
                            >
                              <Copy size={16} /> Copy Text
                            </button>
                          </div>
                        </div>
                        <div className="p-12 max-h-[800px] overflow-y-auto custom-scrollbar bg-card/50">
                          <div className="prose prose-invert max-w-none text-foreground leading-relaxed font-serif text-lg">
                            <ReactMarkdown>{draftResult}</ReactMarkdown>
                            {isDraftLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                          </div>
                        </div>
                        <div className="p-8 bg-secondary/30 border-t border-border">
                          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.3em] font-bold">
                            End of Document • Generated by Lexalyse DraftDash
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* JURISNEST AI SECTION */}
          {activeTab === 'research' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col relative w-full overflow-hidden bg-background"
            >
              {/* Modern Background Accents */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
                  {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
                      >
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Lexalyse AI</span>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl"
                      >
                        <Sparkles size={40} className="text-primary" />
                      </motion.div>
                      <div className="space-y-4">
                        <motion.h2 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-4xl md:text-5xl font-bold tracking-tight"
                        >
                          How can I help you today?
                        </motion.h2>
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed"
                        >
                          Experience the next generation of legal research. 
                          Ask about case laws, statutes, or upload documents for instant analysis.
                        </motion.p>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
                      >
                        {[
                          "Analyze the Doctrine of Pith and Substance",
                          "Summarize the Kesavananda Bharati case",
                          "Draft a legal notice for breach of contract",
                          "Compare IPC Section 302 with BNS Section 101"
                        ].map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => setChatInput(suggestion)}
                            className="text-left p-4 rounded-2xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all text-sm group"
                          >
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{suggestion}</span>
                          </button>
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {chatMessages.length > 0 && (
                    <div className="flex justify-end mb-4">
                      <button 
                        onClick={() => {
                          setChatMessages([]);
                          toast.info("Chat cleared");
                        }}
                        className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-destructive/10"
                      >
                        <X size={12} /> Clear Conversation
                      </button>
                    </div>
                  )}

                  {chatMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex w-full gap-4",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                        msg.role === 'user' ? "bg-secondary border-border" : "bg-primary border-primary"
                      )}>
                        {msg.role === 'user' ? <Users size={14} /> : <Bot size={14} className="text-primary-foreground" />}
                      </div>
                      
                      <div className={cn(
                        "flex flex-col space-y-2 max-w-[85%]",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "rounded-2xl px-5 py-3.5 shadow-sm relative group/msg",
                          msg.role === 'user' 
                            ? "bg-secondary text-foreground rounded-tr-none" 
                            : "bg-muted/50 border border-border text-foreground rounded-tl-none"
                        )}>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              toast.success("Copied to clipboard");
                            }}
                            className={cn(
                              "absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-xl opacity-0 group-hover/msg:opacity-100 transition-all hover:bg-secondary hover:scale-110 active:scale-95 shadow-lg z-30",
                              msg.role === 'user' ? "hidden" : ""
                            )}
                            title="Copy message"
                          >
                            <Copy size={14} className="text-muted-foreground" />
                          </button>

                          {msg.role === 'model' && (
                            <div className="flex items-center gap-2 mb-2 text-primary text-[10px] font-bold uppercase tracking-widest">
                              <Sparkles size={10} /> Lexalyse AI
                            </div>
                          )}
                          
                          {msg.files && msg.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {msg.files.map((file, fIdx) => (
                                <div key={fIdx} className="rounded-xl overflow-hidden border border-border bg-background/50">
                                  {file.mimeType.startsWith('image/') ? (
                                    <img 
                                      src={file.data} 
                                      alt={file.name} 
                                      className="max-w-[240px] max-h-[240px] object-contain"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-3 p-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <FileText size={16} className="text-primary" />
                                      </div>
                                      <span className="text-xs font-medium">{file.name}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.role === 'model' ? (
                            <div className="prose prose-invert prose-sm md:prose-base max-w-none leading-relaxed">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                              {isAiLoading && idx === chatMessages.length - 1 && (
                                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                              )}
                            </div>
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAiLoading && chatMessages[chatMessages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary border border-primary flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-primary-foreground" />
                      </div>
                      <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Modern Input Area */}
              <div className={cn(
                "z-20 transition-all duration-300",
                chatMessages.length > 0 ? "p-2 md:p-3" : "p-4 md:p-8"
              )}>
                <div className="max-w-3xl mx-auto relative">
                  <AnimatePresence>
                    {chatFiles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 right-0 mb-4 flex flex-wrap gap-3 p-4 bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl"
                      >
                        {chatFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            {file.mimeType.startsWith('image/') ? (
                              <img 
                                src={file.data} 
                                alt={file.name} 
                                className="w-20 h-20 object-cover rounded-xl border border-border shadow-sm"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-secondary rounded-xl border border-border flex flex-col items-center justify-center p-2 text-center">
                                <FileText size={24} className="text-primary mb-1" />
                                <span className="text-[10px] text-muted-foreground truncate w-full">{file.name}</span>
                              </div>
                            )}
                            <button 
                              onClick={() => removeFile(idx)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn(
                    "bg-secondary/80 backdrop-blur-2xl border border-border rounded-[20px] shadow-2xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30",
                    chatMessages.length > 0 ? "p-0.5" : "p-1.5"
                  )}>
                    <div className="flex items-end gap-1 px-1">
                      <div className={cn("flex items-center gap-1 pb-1", chatMessages.length > 0 ? "pb-0.5" : "pb-1")}>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "text-muted-foreground hover:text-foreground hover:bg-background rounded-full flex items-center justify-center transition-all shrink-0",
                            chatMessages.length > 0 ? "w-8 h-8" : "w-9 h-9"
                          )}
                          title="Upload documents"
                        >
                          <Paperclip size={chatMessages.length > 0 ? 16 : 18} />
                        </button>
                        <button 
                          onClick={toggleListening}
                          className={cn(
                            "rounded-full flex items-center justify-center transition-all shrink-0",
                            isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-background",
                            chatMessages.length > 0 ? "w-8 h-8" : "w-9 h-9"
                          )}
                          title={isListening ? "Stop listening" : "Voice input"}
                        >
                          <Mic size={chatMessages.length > 0 ? 16 : 18} />
                        </button>
                      </div>
                      
                      <textarea 
                        rows={1}
                        placeholder="Ask Lexalyse AI anything..." 
                        className={cn(
                          "flex-1 bg-transparent border-none text-foreground px-2 focus:outline-none placeholder:text-muted-foreground resize-none text-sm md:text-base max-h-40 custom-scrollbar transition-all",
                          chatMessages.length > 0 ? "py-1 min-h-[32px]" : "py-2.5 min-h-[44px]"
                        )}
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSubmit();
                          }
                        }}
                      />
                      
                      <div className={cn("pb-1", chatMessages.length > 0 ? "pb-0.5" : "pb-1")}>
                        <button 
                          onClick={handleChatSubmit}
                          disabled={(!chatInput.trim() && chatFiles.length === 0) || isAiLoading}
                          className={cn(
                            "bg-primary text-primary-foreground hover:opacity-90 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shrink-0",
                            chatMessages.length > 0 ? "w-8 h-8" : "w-9 h-9"
                          )}
                        >
                          <Send size={chatMessages.length > 0 ? 14 : 16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn("flex justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium transition-all", chatMessages.length > 0 ? "mt-1.5" : "mt-3")}>
                    <ShieldAlert size={10} />
                    <span>AI can make mistakes. Verify legal citations.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* UPGRADE MODAL */}
      <AnimatePresence>
        {selectedCaseApiData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-border w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Gavel size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-none">Case Details</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Source: District Court API</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCaseApiData(null)}
                  className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(selectedCaseApiData).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-widest text-foreground font-bold">{key.replace(/_/g, ' ')}</h4>
                      <div className="p-4 bg-primary/5 border border-border rounded-xl text-sm text-muted-foreground leading-relaxed">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t border-border bg-secondary/30 flex justify-end">
                <button 
                  onClick={() => setSelectedCaseApiData(null)}
                  className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING OVERLAY FOR CASE API */}
      <AnimatePresence>
        {isCaseApiLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-foreground font-medium animate-pulse">Fetching Case Details...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPGRADE MODAL */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
              
              {/* Icon & Main Text */}
              <div className="flex gap-3 flex-1">
                <ShieldAlert className="text-foreground shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-bold">DISCLAIMER: NOT LEGAL ADVICE.</span> Lexalyse is an educational and research platform only. The "Simplified Law" and "AI Assistant" features are for academic purposes and do not constitute legal advice or an attorney-client relationship. Always refer to official government Gazettes for the definitive text of Bare Acts. 
                  <span className="block md:inline md:ml-2 mt-2 md:mt-0">
                    <span className="text-foreground font-bold">| LIMITATION OF LIABILITY:</span> Lexalyse shall not be held liable for any legal consequences, losses, or damages arising from the use or interpretation of the simplified content provided herein.
                  </span>
                </div>
              </div>

              {/* Institutional Use & Close */}
              <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 border-border pt-3 md:pt-0">
                <div className="flex items-center gap-2">
                  <XCircle className="text-muted-foreground" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">INSTITUTIONAL USE</p>
                    <p className="text-[10px] text-muted-foreground">Support Tool Only.</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowDisclaimer(false)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// UI HELPER COMPONENTS
// UI HELPER COMPONENTS
const LexalyseLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
      <path d="M50 5L15 20V45C15 70 50 95 50 95C50 95 85 70 85 45V20L50 5Z" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
      <path d="M50 25V75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary"/>
      <path d="M30 40V60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary/60"/>
      <path d="M70 40V60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary/60"/>
    </svg>
  </div>
);

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    )}
  >
    <div className={cn(
      "transition-transform duration-200 group-hover:scale-110",
      active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
    )}>
      {icon}
    </div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all group">
    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest group-hover:text-primary transition-colors">{title}</p>
    <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
  </div>
);

export default LexalyseApp;
