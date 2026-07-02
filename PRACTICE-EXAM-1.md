# AWS Solutions Architect Associate (SAA-C03) - Practice Exam 1

> **Instructions:** Read each question carefully. Click on the answer to reveal the correct solution and explanation.

---

## Question 1

A company collects data for temperature, humidity, and atmospheric pressure in cities across multiple continents. The average volume of data that the company collects from each site daily is 500 GB. Each site has a high-speed Internet connection.

The company wants to aggregate the data from all these global sites as quickly as possible in a single Amazon S3 bucket. The solution must minimize operational complexity.

Which solution meets these requirements?

- **A.** Turn on S3 Transfer Acceleration on the destination S3 bucket. Use multipart uploads to directly upload site data to the destination S3 bucket.
- **B.** Use AWS DataSync to transfer data from each site to the destination S3 bucket.
- **C.** Use AWS Snowball Edge devices to transfer data from each site to the destination S3 bucket.
- **D.** Use AWS Storage Gateway to transfer data from each site to the destination S3 bucket.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

S3 Transfer Acceleration is ideal for long-distance transfers and uses CloudFront Edge Locations. It can speed up content transfers to and from S3 by 50-500%. Combined with multipart uploads, it provides the fastest way to upload large amounts of data from distributed global locations while minimizing operational complexity.

</details>

---

## Question 2

A company needs the ability to analyze the log files of its proprietary application. The logs are stored in JSON format in an Amazon S3 bucket. Queries will be simple and will run on-demand. A solutions architect needs to perform the analysis with minimal changes to the existing architecture.

What should the solutions architect do to meet these requirements with the LEAST amount of operational overhead?

- **A.** Use Amazon Redshift to load and analyze the log files.
- **B.** Use Amazon Athena directly with Amazon S3 to run the queries as needed.
- **C.** Use AWS Glue to transform the data and Amazon QuickSight to analyze it.
- **D.** Use Amazon EMR to process and analyze the log files.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon Athena is an interactive query service that makes it easy to analyze data directly in Amazon S3 using standard SQL. With a few actions in the AWS Management Console, you can point Athena at your data stored in Amazon S3 and begin using standard SQL to run ad-hoc queries and get results in seconds, with minimal operational overhead.

</details>

---

## Question 3

A company uses AWS Organizations to manage multiple AWS accounts for different departments. The management account has an Amazon S3 bucket that contains project reports. The company wants to limit access to this S3 bucket to only users of accounts within the organization in AWS Organizations.

Which solution meets these requirements with the LEAST amount of operational overhead?

- **A.** Add the aws:PrincipalOrgID global condition key with a reference to the organization ID to the S3 bucket policy.
- **B.** Create a bucket policy that lists all account IDs in the organization.
- **C.** Use AWS IAM Identity Center to manage access to the S3 bucket.
- **D.** Configure cross-account IAM roles for each department account.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

The `aws:PrincipalOrgID` global condition key simplifies specifying the Principal element in a resource-based policy. It provides an alternative to listing all the account IDs for all AWS accounts in an organization. Instead of listing all accounts, you specify the organization ID in the Condition element, limiting access to only users within the organization.

</details>

---

## Question 4

An application runs on an Amazon EC2 instance in a VPC. The application processes logs that are stored in an Amazon S3 bucket. The EC2 instance needs to access the S3 bucket without connectivity to the internet.

Which solution will provide private network connectivity to Amazon S3?

- **A.** Create a NAT gateway in a public subnet.
- **B.** Create an internet gateway and attach it to the VPC.
- **C.** Create a gateway VPC endpoint to the S3 bucket.
- **D.** Create a VPN connection between the VPC and S3.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

A VPC endpoint allows you to connect to AWS services using a private network instead of using the public Internet. With a gateway endpoint, you can access Amazon S3 from your VPC without requiring an internet gateway or NAT device, and with no additional cost.

</details>

---

## Question 5

A company is hosting a web application on AWS using a single Amazon EC2 instance that stores user-uploaded documents in an Amazon EBS volume. For better scalability and availability, the company duplicated the architecture and created a second EC2 instance and EBS volume in another Availability Zone, placing both behind an Application Load Balancer. After completing this change, users reported that, each time they refreshed the website, they could see one subset of their documents or the other, but never all of the documents at the same time.

What should a solutions architect propose to ensure users see all of their documents at once?

- **A.** Enable cross-zone load balancing on the Application Load Balancer.
- **B.** Configure sticky sessions on the Application Load Balancer.
- **C.** Copy the data from both EBS volumes to Amazon EFS. Modify the application to save new documents to Amazon EFS.
- **D.** Set up EBS volume replication between the two instances.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

Amazon EFS provides scalability, availability, and shared access, allowing both EC2 instances to access and synchronize the documents seamlessly. Unlike EBS volumes, which cannot be shared in real time across multiple instances and Availability Zones, Amazon EFS allows both EC2 instances to access the same file system simultaneously, ensuring all users see the same set of documents.

</details>

---

## Question 6

A company uses NFS to store large video files in on-premises network attached storage. Each video file ranges in size from 1 MB to 500 GB. The total storage is 70 TB and is no longer growing. The company decides to migrate the video files to Amazon S3. The company must migrate the video files as soon as possible while using the least possible network bandwidth.

Which solution will meet these requirements?

- **A.** Use AWS DataSync to transfer the files directly to Amazon S3.
- **B.** Create an AWS Snowball Edge job. Receive a Snowball Edge device on premises. Use the Snowball Edge client to transfer data to the device. Return the device so that AWS can import the data into Amazon S3.
- **C.** Set up AWS Storage Gateway File Gateway and copy the files to S3 over time.
- **D.** Use AWS Direct Connect to establish a dedicated connection for the migration.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

On a Snowball Edge device you can copy files with speeds up to 100Gbps. 70TB will transfer in less than 2 hours. While it takes 6-9 working days total (shipping + processing), it uses zero network bandwidth, making it ideal for this scenario where bandwidth conservation is required.

</details>

---

## Question 7

A company has an application that ingests incoming messages. Dozens of other applications and microservices then quickly consume these messages. The number of messages varies drastically and sometimes increases suddenly to 100,000 each second. The company wants to decouple the solution and increase scalability.

Which solution meets these requirements?

- **A.** Use Amazon Kinesis Data Streams to ingest messages and have applications consume from the stream.
- **B.** Use Amazon MQ to buffer messages between producers and consumers.
- **C.** Use AWS Lambda to directly process messages from the ingestion application.
- **D.** Publish the messages to an Amazon Simple Notification Service (Amazon SNS) topic with multiple Amazon Simple Queue Service (Amazon SQS) subscriptions. Configure the consumer applications to process the messages from the queues.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: D**

SNS with SQS subscriptions provides a decoupled architecture. Each SQS subscription can have a filter policy that matches only relevant messages. While SQS queues can handle up to 3,000 messages per second (expandable to 10,000 with AWS Support), the SNS-SQS pattern allows horizontal scaling across multiple queues for high-throughput scenarios.

</details>

---

## Question 8

A company is migrating a distributed application to AWS. The application serves variable workloads. The legacy platform consists of a primary server that coordinates jobs across multiple compute nodes. The company wants to modernize the application with a solution that maximizes resiliency and scalability.

How should a solutions architect design the architecture to meet these requirements?

- **A.** Use AWS Step Functions to coordinate jobs across EC2 instances.
- **B.** Configure an Amazon Simple Queue Service (Amazon SQS) queue as a destination for the jobs. Implement the compute nodes with Amazon EC2 instances that are managed in an Auto Scaling group. Configure EC2 Auto Scaling based on the size of the queue.
- **C.** Use AWS Lambda functions to process jobs with Amazon EventBridge for scheduling.
- **D.** Deploy the application on Amazon ECS with Service Auto Scaling.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

This option provides a decoupled architecture where jobs are sent to an SQS queue. The compute nodes (EC2 instances in an Auto Scaling group) can then process these jobs. Scaling based on the size of the SQS queue allows the architecture to adapt to variable workloads, scaling out when queue depth increases and scaling in when depth decreases.

</details>

---

## Question 9

A company is running an SMB file server in its data center. The file server stores large files that are accessed frequently for the first few days after the files are created. After 7 days the files are rarely accessed.

The total data size is increasing and is close to the company's total storage capacity. A solutions architect must increase the company's available storage space without losing low-latency access to the most recently accessed files. The solutions architect must also provide file lifecycle management to avoid future storage issues.

Which solution will meet these requirements?

- **A.** Use AWS DataSync to replicate files to Amazon S3 and delete local copies after 7 days.
- **B.** Create an Amazon S3 File Gateway to extend the company's storage space. Create an S3 Lifecycle policy to transition the data to S3 Glacier Deep Archive after 7 days.
- **C.** Replace the on-premises file server with an AWS Storage Gateway Volume Gateway.
- **D.** Use AWS Transfer Family to move files to Amazon S3 automatically.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

Amazon S3 File Gateway provides a hybrid cloud storage solution, integrating on-premises environments with cloud storage. Files written to the file share are automatically saved as S3 objects. With S3 Lifecycle policies, you can transition objects between storage classes. Transitioning to Glacier Deep Archive is suitable for rarely accessed files, addressing both storage capacity and lifecycle management requirements.

</details>

---

## Question 10

A company is building an ecommerce web application on AWS. The application sends information about new orders to an Amazon API Gateway REST API to process. The company wants to ensure that orders are processed in the order that they are received.

Which solution will meet these requirements?

- **A.** Use an API Gateway integration to send a message to an Amazon Simple Queue Service (Amazon SQS) standard queue when the application receives an order. Configure the SQS queue to invoke an AWS Lambda function for processing.
- **B.** Use an API Gateway integration to send a message to an Amazon Simple Queue Service (Amazon SQS) FIFO queue when the application receives an order. Configure the SQS FIFO queue to invoke an AWS Lambda function for processing.
- **C.** Use an API Gateway integration to send a message to an Amazon Simple Notification Service (Amazon SNS) topic when the application receives an order. Configure the SNS topic to invoke an AWS Lambda function for processing.
- **D.** Use an API Gateway integration to invoke an AWS Lambda function directly when the application receives an order.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: B**

SQS FIFO (First-In-First-Out) queues are designed to ensure that messages are processed in the order they are received. This is exactly what the ecommerce application needs to process orders sequentially as they arrive.

</details>

---

## Question 11

A company has an application that runs on Amazon EC2 instances and uses an Amazon Aurora database. The EC2 instances connect to the database by using user names and passwords that are stored locally in a file. The company wants to minimize the operational overhead of credential management.

What should a solutions architect do to accomplish this goal?

- **A.** Use AWS Secrets Manager and attach an IAM role that grants access to that secret to the EC2 instances that need it. Turn on automatic rotation.
- **B.** Store the credentials in AWS Systems Manager Parameter Store and use IAM roles for access.
- **C.** Use AWS Certificate Manager to manage database certificates.
- **D.** Store credentials in Amazon S3 with encryption and use IAM roles for access.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Secrets Manager is a secrets management service that helps protect access to applications, services, and IT resources. It enables rotation, management, and retrieval of database credentials throughout their lifecycle. Automatic rotation eliminates the operational overhead of manual credential management.

</details>

---

## Question 12

A global company hosts its web application on Amazon EC2 instances behind an Application Load Balancer (ALB). The web application has static data and dynamic data. The company stores its static data in an Amazon S3 bucket. The company wants to improve performance and reduce latency for the static data and dynamic data. The company is using its own domain name registered with Amazon Route 53.

What should a solutions architect do to meet these requirements?

- **A.** Create an Amazon CloudFront distribution that has the S3 bucket and the ALB as origins. Configure Route 53 to route traffic to the CloudFront distribution.
- **B.** Use Amazon S3 Transfer Acceleration for the static content and enable ALB caching for dynamic content.
- **C.** Deploy the application in multiple Regions and use Route 53 latency-based routing.
- **D.** Use AWS Global Accelerator with the ALB and S3 bucket as endpoints.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

CloudFront allows you to set up multiple origins for your distribution - both the ALB (for dynamic content) and the S3 bucket (for static content). This means both dynamic and static content can be served through CloudFront, which caches content at edge locations to reduce latency globally.

</details>

---

## Question 13

A company performs monthly maintenance on its AWS infrastructure. During these maintenance activities, the company needs to rotate the credentials for its Amazon RDS for MySQL databases across multiple AWS Regions.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Store the credentials as secrets in AWS Secrets Manager. Use multi-Region secret replication for the required Regions. Configure Secrets Manager to rotate the secrets on a schedule.
- **B.** Use a custom Lambda function to rotate credentials across all Regions.
- **C.** Store credentials in AWS Systems Manager Parameter Store with cross-Region replication.
- **D.** Manually rotate credentials in each Region during maintenance windows.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: A**

AWS Secrets Manager allows storage, management, and rotation of secrets across multiple AWS Regions. Multi-Region secret replication enables seamless rotation of credentials during maintenance activities. Automatic rotation on a schedule minimizes operational overhead.

</details>

---

## Question 14

A company runs an ecommerce application on Amazon EC2 instances behind an Application Load Balancer. The instances run in an Amazon EC2 Auto Scaling group across multiple Availability Zones. The Auto Scaling group scales based on CPU utilization metrics. The ecommerce application stores the transaction data in a MySQL 8.0 database that is hosted on a large EC2 instance.

The database's performance degrades quickly as application load increases. The application handles more read requests than write transactions. The company wants a solution that will automatically scale the database to meet the demand of unpredictable read workloads while maintaining high availability.

Which solution will meet these requirements?

- **A.** Migrate the database to Amazon DynamoDB with on-demand capacity.
- **B.** Use Amazon RDS for MySQL with a Multi-AZ deployment and read replicas.
- **C.** Use Amazon Aurora with a Multi-AZ deployment. Configure Aurora Auto Scaling with Aurora Replicas.
- **D.** Use Amazon Redshift for the database with Auto Scaling enabled.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

Amazon Aurora is a MySQL-compatible relational database engine that provides high performance and scalability. With Multi-AZ deployment, the database is automatically replicated across multiple Availability Zones for high availability. Aurora Auto Scaling automatically adds or removes Aurora Replicas based on workload, ensuring read requests can be distributed effectively.

</details>

---

## Question 15

A company recently migrated to AWS and wants to implement a solution to protect the traffic that flows in and out of the production VPC. The company had an inspection server in its on-premises data center. The inspection server performed specific operations such as traffic flow inspection and traffic filtering. The company wants to have the same functionalities in the AWS Cloud.

Which solution will meet these requirements?

- **A.** Use AWS WAF to protect against common web exploits.
- **B.** Deploy a third-party firewall on EC2 instances in the VPC.
- **C.** Use AWS Network Firewall to create the required rules for traffic inspection and traffic filtering for the production VPC.
- **D.** Use security groups and NACLs to filter traffic.

<details>
<summary><strong>Reveal Answer</strong></summary>

**Correct Answer: C**

AWS Network Firewall is a managed firewall service that provides filtering for both inbound and outbound network traffic. It allows you to create rules for traffic inspection and filtering, which helps protect your production VPC with centralized traffic inspection capabilities.

</details>

---

**End of Practice Exam 1**

> **Tip:** Review any questions you got wrong and study the explanations before moving to the next exam.

---

**Navigation:**
- [Practice Exam 2](./PRACTICE-EXAM-2.md)
