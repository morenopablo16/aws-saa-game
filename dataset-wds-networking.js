// Mini-dataset: Networking / VIF (Direct Connect, Transit Gateway, VPC Lattice, PrivateLink)
// Curado a mano a partir de preguntas reales que aparecieron en un examen WDS y no se
// habían repasado. Respuestas y explicaciones verificadas contra documentación oficial
// de AWS (tipos de VIF, VPC Lattice, PrivateLink) — no son un volcado de un dump externo.
// Se carga como pack independiente ("Exam 12") junto a quiz-data-all.js.

const QUESTIONS_WDS_NETWORKING = [
  {
    "id": "wds-1",
    "exam": "Exam 12",
    "index": 1,
    "tags": ["SAA-C03", "Direct Connect", "VIF"],
    "prompt": "A company has an on-premises data center connected to AWS by using AWS Direct Connect. The company needs to access Amazon EC2 instances in a single VPC by using private IP addresses. The company wants the simplest architecture. What should a solutions architect configure?",
    "options": [
      { "k": "A", "html": "A public VIF and an internet gateway" },
      { "k": "B", "html": "A private VIF and a virtual private gateway" },
      { "k": "C", "html": "A transit VIF and a transit gateway" },
      { "k": "D", "html": "A public VIF and a Direct Connect gateway" }
    ],
    "correct": ["B"],
    "explanation": "Un VIF privado conectado directamente a una Virtual Private Gateway (VGW) de esa VPC es el camino más simple para llegar a instancias EC2 por IP privada. No hace falta Direct Connect Gateway ni Transit Gateway para una única VPC en la misma cuenta/región — esas piezas solo aportan valor cuando necesitas llegar a VGWs en otras cuentas/regiones o a un Transit Gateway. El VIF público solo alcanza endpoints públicos de AWS, y el VIF de tránsito exige un Transit Gateway de por medio."
  },
  {
    "id": "wds-2",
    "exam": "Exam 12",
    "index": 2,
    "tags": ["SAA-C03", "Direct Connect", "Transit Gateway"],
    "prompt": "A company has 40 VPCs connected to an AWS Transit Gateway. The company needs its on-premises data center to access all the VPCs through a single AWS Direct Connect connection. Which solution is the most appropriate?",
    "options": [
      { "k": "A", "html": "A private VIF and an internet gateway" },
      { "k": "B", "html": "A transit VIF, a Direct Connect gateway, and a transit gateway" },
      { "k": "C", "html": "A public VIF and a virtual private gateway" },
      { "k": "D", "html": "40 private VIFs, one for each VPC" }
    ],
    "correct": ["B"],
    "explanation": "La cadena correcta es: on-premises → VIF de tránsito → Direct Connect Gateway → Transit Gateway (mediante una asociación) → las 40 VPCs. El VIF de tránsito es el único tipo de VIF que puede llegar a un Transit Gateway, y siempre lo hace a través de una Direct Connect Gateway. Crear 40 VIFs privados no escala: necesitarías 40 conexiones/VLANs distintas."
  },
  {
    "id": "wds-3",
    "exam": "Exam 12",
    "index": 3,
    "tags": ["SAA-C03", "Direct Connect", "VIF"],
    "prompt": "A company uses AWS Direct Connect and wants its on-premises environment to access public AWS service endpoints over the Direct Connect connection instead of through the internet. Which type of virtual interface should the company use?",
    "options": [
      { "k": "A", "html": "Private VIF" },
      { "k": "B", "html": "Transit VIF" },
      { "k": "C", "html": "Public VIF" },
      { "k": "D", "html": "Interface VPC endpoint" }
    ],
    "correct": ["C"],
    "explanation": "El VIF público es exactamente para esto: alcanzar endpoints públicos de AWS (S3, DynamoDB, etc.) por el enlace dedicado de Direct Connect en lugar de por Internet. El VIF privado solo llega a recursos dentro de una VPC por IP privada, no ve endpoints públicos. Un interface VPC endpoint (PrivateLink) no tiene relación con el enrutamiento de Direct Connect."
  },
  {
    "id": "wds-4",
    "exam": "Exam 12",
    "index": 4,
    "tags": ["SAA-C03", "VPC Lattice", "Multi-account"],
    "prompt": "An organization has 25 VPCs in different AWS accounts. Each VPC contains several microservices. The teams want the services to communicate without configuring VPC peering for every VPC combination. The teams also need service-level authorization policies and centralized observability. Which service should the organization use?",
    "options": [
      { "k": "A", "html": "AWS Transit Gateway" },
      { "k": "B", "html": "AWS PrivateLink" },
      { "k": "C", "html": "Amazon VPC Lattice" },
      { "k": "D", "html": "AWS Direct Connect Gateway" }
    ],
    "correct": ["C"],
    "explanation": "Amazon VPC Lattice es exactamente para esto: conecta servicios entre VPCs y cuentas sin necesidad de peering en malla completa, ofrece políticas de autorización basadas en IAM a nivel de servicio o de service network, y trae observabilidad integrada (métricas en CloudWatch, access logs y un Service Map). Transit Gateway resuelve el problema de enrutamiento N×N pero no entiende de 'autorización a nivel de servicio' ni de observabilidad de aplicación — solo mueve paquetes."
  },
  {
    "id": "wds-5",
    "exam": "Exam 12",
    "index": 5,
    "tags": ["SAA-C03", "PrivateLink", "SaaS"],
    "prompt": "A SaaS provider runs a private application in its VPC. The provider wants hundreds of AWS customers to access only that application through private IP connectivity. The provider does not want to provide full network connectivity between the customer VPCs and the provider VPC.",
    "options": [
      { "k": "A", "html": "VPC Peering" },
      { "k": "B", "html": "AWS PrivateLink" },
      { "k": "C", "html": "Transit Gateway peering" },
      { "k": "D", "html": "AWS Site-to-Site VPN" }
    ],
    "correct": ["B"],
    "explanation": "AWS PrivateLink está diseñado exactamente para esta forma: un proveedor SaaS expone UNA aplicación mediante un Endpoint Service respaldado por un NLB, y cada cliente crea un Interface VPC Endpoint para llegar a ella de forma privada. No hay peering, no hay tablas de rutas que gestionar, no importa si los CIDR se solapan, y el acceso es unidireccional (el consumidor llega al servicio, nunca al revés) — justo lo que pide el enunciado al decir 'sin conectividad de red completa'."
  },
  {
    "id": "wds-6",
    "exam": "Exam 12",
    "index": 6,
    "tags": ["SAA-C03", "Direct Connect", "Direct Connect Gateway"],
    "prompt": "A company has an AWS Direct Connect connection and needs private connectivity from its on-premises environment to multiple VPCs in different AWS Regions. The company does not use AWS Transit Gateway. Which architecture is appropriate?",
    "options": [
      { "k": "A", "html": "Private VIF → Direct Connect gateway → virtual private gateways attached to the VPCs" },
      { "k": "B", "html": "Transit VIF → internet gateway → VPCs" },
      { "k": "C", "html": "Public VIF → Direct Connect gateway → VPCs" },
      { "k": "D", "html": "Private VIF → NAT gateway → VPCs" }
    ],
    "correct": ["A"],
    "explanation": "Sin Transit Gateway, la Direct Connect Gateway es la pieza que permite llegar a VPCs en OTRAS regiones desde un único VIF privado: VIF privado → Direct Connect Gateway → una Virtual Private Gateway por cada VPC destino (la DX Gateway puede asociarse con VGWs de distintas cuentas y regiones). Este es el patrón multi-región anterior a Transit Gateway, y sigue siendo válido cuando no quieres esa capa adicional."
  },
  {
    "id": "wds-7",
    "exam": "Exam 12",
    "index": 7,
    "tags": ["SAA-C03", "Direct Connect", "Transit Gateway"],
    "prompt": "A company uses AWS Direct Connect and an AWS Transit Gateway that connects 60 VPCs. Which component is used between the transit VIF and the transit gateway?",
    "options": [
      { "k": "A", "html": "Virtual private gateway" },
      { "k": "B", "html": "Direct Connect gateway" },
      { "k": "C", "html": "Internet gateway" },
      { "k": "D", "html": "NAT gateway" }
    ],
    "correct": ["B"],
    "explanation": "Una Direct Connect Gateway se sitúa entre el VIF de tránsito y el Transit Gateway: el VIF de tránsito termina en la DX Gateway, y esta se asocia con el Transit Gateway. La Virtual Private Gateway es la pieza equivalente cuando el destino es una VPC individual con un VIF privado, no un Transit Gateway."
  },
  {
    "id": "wds-8",
    "exam": "Exam 12",
    "index": 8,
    "tags": ["SAA-C03", "VPC Lattice", "Microservices"],
    "prompt": "Two applications are deployed in different VPCs and different AWS accounts. The company needs to allow only the orders service to invoke the payments service. The company wants to avoid managing network routing between all VPCs. Which solution is most appropriate?",
    "options": [
      { "k": "A", "html": "Amazon VPC Lattice service network with authorization policies" },
      { "k": "B", "html": "AWS Transit Gateway with a shared route table" },
      { "k": "C", "html": "VPC Peering with a network ACL" },
      { "k": "D", "html": "AWS Direct Connect Gateway" }
    ],
    "correct": ["A"],
    "explanation": "Mismo patrón que la pregunta 4: una service network de VPC Lattice con políticas de autorización te permite decir 'el principal del servicio orders puede invocar al servicio payments' sin aprovisionar ni mantener peering ni tablas de rutas entre esas VPCs — VPC Lattice se encarga del enrutamiento y del service discovery por debajo. Transit Gateway y VPC Peering sí exigen gestionar rutas, que es justo lo que el enunciado quiere evitar."
  },
  {
    "id": "wds-9",
    "exam": "Exam 12",
    "index": 9,
    "tags": ["SAA-C03", "Direct Connect", "VIF"],
    "prompt": "A company has an AWS Direct Connect connection with a private VIF. What is the primary purpose of the private VIF?",
    "options": [
      { "k": "A", "html": "Access public AWS service endpoints" },
      { "k": "B", "html": "Access VPC resources by using private IP addresses" },
      { "k": "C", "html": "Connect directly to a transit gateway without any additional components" },
      { "k": "D", "html": "Accelerate global HTTP traffic" }
    ],
    "correct": ["B"],
    "explanation": "Definición directa de la documentación de AWS: un VIF privado se usa para acceder a una VPC por IP privada. Los endpoints públicos son cosa del VIF público, y llegar a un Transit Gateway exige un VIF de tránsito (nunca uno privado directamente)."
  },
  {
    "id": "wds-10",
    "exam": "Exam 12",
    "index": 10,
    "tags": ["SAA-C03", "VPC Lattice", "Microservices"],
    "prompt": "A company has 200 microservices running on Amazon ECS, Amazon EC2, and AWS Lambda across multiple VPCs. The company wants a common framework for service connectivity, routing, service discovery, and access control. Which AWS service should the company evaluate first?",
    "options": [
      { "k": "A", "html": "Amazon CloudFront" },
      { "k": "B", "html": "Amazon VPC Lattice" },
      { "k": "C", "html": "AWS Direct Connect" },
      { "k": "D", "html": "Route 53 Resolver" }
    ],
    "correct": ["B"],
    "explanation": "VPC Lattice está diseñado explícitamente para esto: unificar conectividad, enrutamiento, service discovery y control de acceso para servicios que corren en distintos tipos de cómputo (EC2, ECS, Lambda) y distintas VPCs/cuentas, sin que cada equipo tenga que reinventar su propia capa de red. CloudFront es CDN, Direct Connect es conectividad on-premises, y Route 53 Resolver es DNS — ninguno cubre el conjunto completo que pide el enunciado."
  },
  {
    "id": "wds-11",
    "exam": "Exam 12",
    "index": 11,
    "tags": ["SAA-C03", "Direct Connect", "Transit Gateway"],
    "prompt": "A company wants to connect its on-premises data center through AWS Direct Connect to an AWS Transit Gateway that connects many VPCs. Which two components are specifically required between Direct Connect and the transit gateway? (Choose two.)",
    "options": [
      { "k": "A", "html": "Transit VIF" },
      { "k": "B", "html": "Direct Connect gateway" },
      { "k": "C", "html": "Internet gateway" },
      { "k": "D", "html": "NAT gateway" },
      { "k": "E", "html": "Public VIF" }
    ],
    "correct": ["A", "B"],
    "explanation": "Para llegar de Direct Connect a un Transit Gateway hacen falta ambas piezas: un VIF de tránsito (el único VIF que puede dirigirse a un Transit Gateway) y una Direct Connect Gateway (la pieza intermedia que se asocia con el Transit Gateway). Internet gateway y NAT gateway no participan en absoluto en esta ruta privada, y el VIF público solo sirve para endpoints públicos."
  },
  {
    "id": "wds-12",
    "exam": "Exam 12",
    "index": 12,
    "tags": ["SAA-C03", "Direct Connect", "VIF"],
    "prompt": "Which statements about AWS Direct Connect virtual interfaces are correct? (Choose two.)",
    "options": [
      { "k": "A", "html": "A private VIF is commonly used for private connectivity to VPC resources." },
      { "k": "B", "html": "A public VIF is used to connect directly to an AWS Transit Gateway." },
      { "k": "C", "html": "A transit VIF is used with a Direct Connect gateway to access AWS Transit Gateways." },
      { "k": "D", "html": "A transit VIF is primarily used to access public S3 and DynamoDB endpoints." },
      { "k": "E", "html": "A public VIF is required for VPC Peering." }
    ],
    "correct": ["A", "C"],
    "explanation": "A es correcta: el VIF privado es el que se usa habitualmente para llegar a recursos de una VPC por IP privada. C es correcta: el VIF de tránsito se combina con una Direct Connect Gateway precisamente para alcanzar Transit Gateways. B es falsa (llegar a un Transit Gateway exige VIF de tránsito, no público); D es falsa (acceder a S3/DynamoDB públicos es el trabajo del VIF público, no del de tránsito); E es falsa (VPC Peering no tiene nada que ver con Direct Connect ni con ningún tipo de VIF)."
  }
];

// Se añade al banco global de preguntas sin chocar con quiz-data-all.js
// (usa un nombre de variable propio, así que puede cargarse como script
// independiente en la misma página).
if (typeof QUESTIONS === "undefined") {
  window.QUESTIONS = QUESTIONS_WDS_NETWORKING;
} else {
  QUESTIONS.push(...QUESTIONS_WDS_NETWORKING);
}
